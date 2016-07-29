var Promise = require('bluebird');
var config = require('../config');
var db = require('../lib/db');
var convo_model = require('./conversation');
var message_model = require('./message');
var user_model = require('./user');
var error = require('../lib/error');
var util = require('../lib/util');
var language = require('../lib/language');
var log = require('../lib/logger');
var validate = require('../lib/validate');
var us_states = require('../lib/us_states');
var request = require('request-promise');
var notify = require('./notify.js');

// holds conversation chains. essentially, each "step" in the chain defines a
// part of the conversation (generally a question) and how to process the answer.
// this processing step can store data in various places as well as determine
// the next step in the conversationt to run.
//
// note that the `msg` string can template in variables of user data. for
// instance, we do things like:
//
//   msg: 'hello {{fullname}}! how is the weather in {{settings.city}}?'
var chains = {
	vote_1: {
		_start: 'intro_direct',
		intro_direct: {
			msg: 'Welcome to HelloVote! Let\'s get you registered. What\'s your first name?',
			errormsg: 'Please enter your first name',
			next: 'last_name',
			process: simple_store('user.first_name')
		},
		intro_refer: {
			msg: 'Welcome to HelloVote! One of your friends has asked me to help you get registered. What\'s your first name?',
			errormsg: 'Please enter your first name',
			next: 'last_name',
			process: simple_store('user.first_name')
		},
		intro_web: {
			msg: 'Welcome to HelloVote! Let\'s get you registered. What\'s your first name?',
			errormsg: 'Please enter your first name',
			next: 'last_name',
			process: simple_store('user.first_name')
		},
		last_name: {
			msg: 'Hi {{first_name}}, what\'s your last name?',
			errormsg: 'Please enter your last name',
			next: 'zip',
			process: simple_store('user.last_name')
		},
		zip: {
			// create a binding for the user now that we have first name and last name
			pre_process: function(action, conversation, user) {
				if (config.twilio) notify.add_tags(user, ['votebot-started']);
			},
			msg: 'What\'s your zip code?',
			errormsg: 'Please enter your zip code, or SKIP if you don\'t know it.',
			next: 'city',
			process: simple_store('user.settings.zip', {validate: validate.zip})
		},
		city: {
			pre_process: function(action, conversation, user) {
				if(util.object.get(user, 'settings.city')) return {next: 'state'};
			},
			msg: 'What city do you live in?',
			errormsg: 'Please enter your city',
			next: 'state',
			process: simple_store('user.settings.city')
		},
		state: {
			pre_process: function(action, conversation, user) {
				if(util.object.get(user, 'settings.state')) return {next: 'address'};
			},
			msg: 'What state do you live in? (eg CA)',
			errormsg: 'Please enter your state', 
			next: 'address', 
			process: simple_store('user.settings.state', {validate: validate.state})
		},
		address: {
			pre_process: function(action, conversation, user) {
				if (config.twilio) notify.add_tags(user, [user.settings.state]);
			},
			msg: 'What\'s your street address in {{settings.city}}, {{settings.state}}? (including apartment #, if any)',
			errormsg: 'Please enter your street address',
			next: 'date_of_birth',
			process: simple_store('user.settings.address')
		},
		date_of_birth: {
			pre_process: function(action, conversation, user) {
				if (config.twilio) {
					notify.add_identity(user, {
						address: user.settings.address,
						city: user.settings.city,
						state: user.settings.state
					});
				}
			},
			msg: 'When were you born? (MM/DD/YYYY)',
			errormsg: 'Please enter your date of birth as month/day/year',
			next: 'email', 
			process: simple_store('user.settings.date_of_birth', {validate: validate.date})
		},
		email: {
			msg: 'What\'s your email address?',
			errormsg: 'Please enter your email address. If you don\'t have one, reply SKIP',
			next: 'per_state', 
			process: simple_store('user.settings.email', {validate: validate.email})
		},
		// this is a MAGICAL step. it never actually runs, but instead just
		// points to other steps until it runs out of per-state questions to
		// ask. then it parties.
		per_state: {
			pre_process: function(action, conversation, user) {
				var state = util.object.get(user, 'settings.state').trim().toLowerCase();
				var state_questions = us_states.required_questions[state] || us_states.required_questions_default;
				var next_default = {next: 'submit'};

				// no per-state questions? skip!!
				if(!state_questions) return next_default;

				// loop over the per-state questions, skipping any we have
				// already processed. if we get to the end of the list, we
				// load our next step.
				var next = null;
				for(var i = 0; i < state_questions.length; i++)
				{
					var key = state_questions[i];
					var exists = util.object.get(user, 'settings.'+key);
					// if we already have this answer, skip
					if(exists !== undefined) continue;
					next = key;
					break;
				}
				if(next) return {next: next};

				// nothing left, submit to state
				return next_default;
			}
		},
		submit: {
			pre_process: function(action, conversation, user) {
				console.log('submit pre_process', user.settings);
				// check to ensure user has all required fields
				var missing_fields = validate.voter_registration_complete(user.settings);
				if (missing_fields.length) {
					// incomplete, re-query missing fields
					log.info('bot: missing fields!', missing_fields);
					return {next: 'incomplete', errors: missing_fields};
				} else {
					if (config.submit_url) {
						// send to votebot-forms
						log.info('bot: registration is complete! submitting...');
						
						var form_submit = {
						    method: 'POST',
						    uri: config.submit_url,
						    body: {
						    	user: user,
						    	callback_url: '' // TODO, define callback to notify user of form submit success
						    },
						    json: true 
						};
						request(form_submit)
						    .then(function (parsedBody) {
						        // store response from in user.submit
								if (body.status === 'error') {
									return {next: 'incomplete', 'errors': body.errors};
								}
								return user_model.update(user.id, {'submit': body.status});
						    })
						    .catch(function (err) {
						        console.error(error);
								return {next: 'incomplete'};
						    });
					} else {
						log.info('bot: no submit_url in config, skipping...');
						return {next: 'complete'};
					}

					// finally, remove SSN or state ID from our data
					// TODO, lol

					return {next: 'share'};
				} 
			},
			next: 'complete',
			process: simple_store('user.submit', {validate: validate.submit_response}),
		},
		complete: {
			pre_process: function(action, conversation, user) {
				if (config.twilio) notify.replace_tags(user, ['votebot-started'], ['votebot-completed']);
			},
			msg: 'We are processing your registration! Check your email for further instructions.',
			next: 'share', 
			process: simple_store('user.complete', {validate: validate.always_true}),
		},
		incomplete: {
			msg: 'Sorry, your registration is incomplete. (fix/restart)?',
			process: function(body, user) {
				// TODO, re-query missing fields
				console.log('missing fields', util.object.get(user, 'settings.missing_fields'));
				var next = 'incomplete';
				if (body.trim().toUpperCase() === 'RESTART') {
					next = 'restart';
				}
				return Promise.resolve({next: next});
			}
		},
		share: {
			msg: 'Thanks for registering with HelloVote! Share with your friends to get them registered too: http://hellovote.org/share?u=ASDF',
			final: true
		},
		restart: {
			msg: 'This will restart your HelloVote registration! Reply (ok) to continue.',
			errormsg: '',
			next: 'intro_direct',
			process: simple_store('user.settings', {validate: validate.empty_object}),
		},

		// per-state questions
		// !!!!!!!!
		// !!NOTE!! these *HAVE* to store their value in settings.{{name}} where
		// {{name}} is the same as the key name in the conversation object.
		// in other words, the `us_citizen` conversation step needs to store its
		// value in `user.settings.us_citizen` or the bot will infinite loop
		// !!!!!!!!
		us_citizen: {
			msg: 'Are you a US citizen? (yes/no)',
			errormsg: '',
			next: 'per_state', 
			process: simple_store('user.settings.us_citizen', {validate: validate.boolean_yes})
		},
		legal_resident: {
			msg: 'Are you a current legal resident of {{settings.state}}? (yes/no)',
			errormsg: '',
			next: 'per_state', 
			process: simple_store('user.settings.legal_resident', {validate: validate.boolean_yes})
		},
		will_be_18: { 
			pre_process: function(action, conversation, user) {
				// if user has already told us their birthdate, calculate will_be_18 automatically
				if( util.object.get(user, 'settings.date_of_birth') ) {
					var date_of_birth = new Date(util.object.get(user, 'settings.date_of_birth'));
					var next_election = new Date(config.election.date);
					var cutoff_date = next_election.setFullYear(next_election.getFullYear() - 18);
					user.settings.will_be_18 = (cutoff_date >= date_of_birth);
					return {next: 'per_state'};
					// TODO, echo parsed date of birth back to user to confirm?
				}
			},
			msg: 'Are you 18 or older, or will you be by the date of the election? (yes/no)',
			errormsg: '',
			next: 'per_state', 
			process: simple_store('user.settings.will_be_18', {validate: validate.boolean_yes})
		},
		ethnicity: {
			msg: 'What is your ethnicity or race? (asian-pacific/black/hispanic/native-american/white/multi-racial/other)',
			errormsg: 'Please let us know your ethnicity or race.',
			next: 'per_state', 
			process: simple_store('user.settings.ethnicity')
		},
		party: {
			msg: 'What\'s your party preference? (democrat/republican/libertarian/green/other/none)',
			errormsg: 'Please let us know your party preference',
			next: 'per_state', 
			process: simple_store('user.settings.political_party')
		},
		disenfranchised: {
			msg: 'Are you currently disenfranchised from voting (for instance due to a felony conviction)? (yes/no)',
			errormsg: '',
			next: 'per_state', 
			process: simple_store('user.settings.disenfranchised', {validate: validate.boolean_no})
		},
		incompetent: {
			msg: 'Have you been found legally incompetent in your state? (yes/no)',
			errormsg: '',
			next: 'per_state', 
			process: simple_store('user.settings.incompetent', {validate: validate.boolean_no})
		},
		state_id: {
			msg: 'What\'s your {{settings.state}} driver\'s license (or state ID) number?',
			errormsg: 'Please enter your state ID number',
			next: 'per_state', 
			process: simple_store('user.settings.state_id', {validate: validate.state_id})
		},
		state_id_issue_date: {
			msg: 'What date was your state id/driver\'s license issued? (mm/dd/yyyy)',
			errormsg: '',
			next: 'per_state', 
			process: simple_store('user.settings.state_id_issue_date', {validate: validate.date})
		},
		ssn: {
			msg: 'What\'s your SSN? Your information is safe with us, and we don\'t store it after submitting to your state.',
			errormsg: '',
			next: 'per_state', 
			process: simple_store('user.settings.ssn', {validate: validate.ssn})
		},
		ssn_last4: {
			msg: 'What are the last 4 digits of your SSN? Your information is safe with us, and we don\'t store it after submitting to your state.',
			errormsg: 'Please enter the last 4 digits of your SSN.',
			next: 'per_state', 
			process: simple_store('user.settings.ssn_last4', {validate: validate.ssn_last_4})
		},
		state_id_or_ssn_last4: {
			msg: 'What\'s your {{settings.state}} ID number? If you don\'t have one, enter the last 4 digits of your SSN. Your info is safe with us.',
			errormsg: 'Please enter your state ID number or last 4 of your SSN',
			next: 'per_state', 
			process: simple_store('user.settings.state_id_or_ssn_last4')
		},
		gender: {
			msg: 'What\'s your gender?',
			errormsg: '',
			next: 'per_state', 
			process: simple_store('user.settings.gender', {validate: validate.gender})
		},
		county: {
			msg: 'What county do you reside in?',
			errormsg: 'Please enter the name of the county you reside in',
			next: 'per_state', 
			process: simple_store('user.settings.county')
		},
		consent_use_signature: {
			msg: 'May we use your signature on file with the DMV to complete the form with your state? (yes/no)',
			errormsg: 'Please reply YES to let us request your signature from the DMV. We do not store this information.',
			next: 'per_state',
			process: simple_store('user.settings.consent_use_signature', {validate: validate.boolean_yes})
		},
		mail_in: {
			msg: 'Would you like to vote by mail-in ballot?',
			errormsg: '',
			next: 'per_state', 
			process: simple_store('user.settings.mail_in', {validate: validate.boolean})
		},
	}
};

// a helper for very simple ask-and-store type questions.
// can perform data validation as well.
function simple_store(store, options)
{
	options || (options = {});

	return function(body, user, next, errormsg)
	{
		// if we get an empty body, error
		if(!body.trim()) return validate.data_error(errormsg, {promise: true});

		var obj = {};
		obj[store] = body;
		var promise = Promise.resolve({next: next, store: obj});
		if(options.validate)
		{
			promise = options.validate(body, user)
				.spread(function(body, extra_store) {
					extra_store || (extra_store = {});
					extra_store[store] = body;
					return {next: next, store: extra_store};
				});
		}
		return promise;
	};
}

var parse_step = function(step, body, user)
{
	// if the user is canceling, don't bother parsing anything
	if(language.is_cancel(body)) return Promise.resolve({next: '_cancel'});

	// TODO, let user correct previous step
	return step.process(body, user, step.next, step.errormsg);
};

/**
 * given an action, conversation, and user objects, determine the next step in
 * the conversation chain to load.
 */
var find_next_step = function(action, conversation, user)
{
	var state = conversation.state;
	var next = action.next;

	var key = [state.type, next].join('.');
	var nextstep = util.object.get(chains, key);
	if(!nextstep) throw new Error('bot: could not load step: '+ key);

	var default_step = {step: nextstep, name: next};

	if(!nextstep.pre_process) return default_step;
	// call pre-process on our new step.
	var res = nextstep.pre_process(action, conversation, user);
	if(!res || !res.next) return default_step;

	// if our pre_process returns a "next" key, then we know we should load
	// another step. wicked. recurse and find that shit.
	var action = util.object.merge({}, action, {next: res.next});
	return find_next_step(action, conversation, user);
};

/**
 * start a bot-initiated conversation, or continue a web-initiated one
 */
exports.start = function(type, to_user_id, options)
{
	options || (options = {});
	var user;
	return user_model.get(to_user_id)
		.then(function(_user) {
			user = _user;
			if(!user) throw error('user '+user_id+' was not found');
			var chain = chains[type];
			var first_step_name = options.start || chain._start;
			var step = chain[first_step_name];
			if(!step) throw new Error('bot: error loading step: '+type+'.'+step);

			if (!options.existing_conversation_id) {
				return convo_model.create(config.bot.user_id, {
					type: 'bot',
					state: {type: type, step: first_step_name},
					recipients: [user],
					message: { body: step.msg }
				});
			} else {
				convo_model.update(options.existing_conversation_id, {
					state: {type: type, step: first_step_name},
				});
				return message_model.create(
					config.bot.user_id,
					options.existing_conversation_id,
					{ body: step.msg }
					);
			}
		});
};

/**
 * processes an incoming message to our beloved bot. handles loading the convo
 * state, parsing/processing the user's incoming message, and loading the next
 * chain in the conversation.
 */
exports.next = function(user_id, conversation, message)
{
	var user;
	return user_model.get(user_id)
		.then(function(_user) {
			user = _user;
			if(!user) throw error('user '+user_id+' was not found');
			var state = conversation.state;
			var key = [state.type, state.step].join('.');
			var step = util.object.get(chains, key);
			if(!step) throw error('conversation chain missing: '+key);

			var body = message.body;

			// we've reached the final step
			if(step.final)
			{
				log.info('bot: recv msg, but conversation finished');
				if (validate.boolean(body)) {
					log.info('bot: user wants to restart');
					key = [state.type, 'restart'].join('.');
					step = util.object.get(chains, key);
				} else {
					log.info('bot: prompt to restart');
					var restart_msg = 'You are registered with HelloVote. Would you like to start again? (yes/no)'
					return message_model.create(config.bot.user_id, conversation.id, {body: language.template(restart_msg, user)});
				}
			}
			
			return parse_step(step, body, user)
				.then(function(action) {
					log.info('bot: action: ', JSON.stringify(action));

					// if user wants out, let them
					if(action.next == '_cancel') return convo_model.close(conversation.id);

					var promise = Promise.resolve();

					// if we're storing value(s) into object(s), loop over our
					// setters and set them into the object we're saving.
					//
					// NOTE: currently, you can only run multiple setters on
					// *one object*. so you can do user.name and user.age
					// in one pass, but you cannot do user.name and
					// conversation.date...this code would need to be updated
					// to support this and we just don't need it right now
					if(action.store)
					{
						// a set of objects we're allowed to set via the convo chain
						var setters = {
							user: {
								obj: user,
								set: function(obj) { return user_model.update(user_id, obj); }
							}
						};
						var keys = Object.keys(action.store);
						// grab the object we're setting data into based on
						// the FIRST key in our setter object. as mentioned
						// above, we currently only support setting data
						// into one top-level object
						var obj = keys[0].replace(/\..*/, '');
						var setter = setters[obj];
						if(setter)
						{
							keys.forEach(function(place) {
								// grab the value from our setter
								var value = action.store[place];
								// user.settings.address becomes settings.address
								place = place.replace(/^.*?\./, '');
								// recursively set our value into our main object
								util.object.set(setter.obj, place, value);
							});
							// replace the promise with our async setter
							// function's promise (eg, user_model.update)
							promise = setter.set(setter.obj);
						}
					}

					// we're processing the next step, inject some steps
					// into the promise chain
					promise = promise
						.then(function() {
							// get our next step from the conversation chain
							var found = find_next_step(action, conversation, user);
							var nextstep = found.step;

							// destructively modify our conversation state object,
							// replacing the "step" value with our new step's name.
							// this will get saved once our message goes out
							state.step = found.name;

							// create/send the message from the next step in the convo chain
							return message_model.create(config.bot.user_id, conversation.id, {body: language.template(nextstep.msg, user)});
						})
						.then(function() {
							// save our current state into the conversation so's
							// we know where we left off when the next message
							// comes in
							return convo_model.update(conversation.id, {state: state});
						});

					// all done
					return promise;
				})
				// catches ALL errors, whether in validation or in code.
				.catch(function(err) {
					if(err.data_error)
					{
						log.notice('bot: next: data error: ', err);
						if (err.message)
						{
							var message = err.message;
						} else {
							var message = 'Please try again!';
						}

						if(err.end_conversation)
						{
							// TODO: actually end the conversation here
						}
					}
					else
					{
						log.error('bot: next: ', err, err.stack);
						var message = 'I seem to have had a glitch. Please send your last message again.';
					}
					return message_model.create(config.bot.user_id, conversation.id, {body: message});
				})
				// error catching errors. ABORT
				.catch(function(err) {
					log.crit('bot: fatal (giving up): ', err, err.stack);
				});
		});
};

