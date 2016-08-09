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
var us_election = require('../lib/us_election');
var us_states = require('../lib/us_states');
var request = require('request-promise');
var notify = require('./notify.js');
var moment = require('moment');

// holds default steps for conversation chains. essentially, each "step" in the chain defines a
// part of the conversation (generally a question) and how to process the answer.
//
// conversation chains are defined in the database. each step in a conversation chain is
// loaded from the database and then used to override the defaults as listed here.
//
// pre_process functions can change the flow by returning a new step in the 'next' key
// they can also store calculated values on the user object, for use by other steps
// if they return a 'msg' key, the conversation will send an extra prompt, but not advance the state
//
// process functions can store data to the user or conversation model
// simple_store provides easy hooks for validation and setting nested keys 
// if they return an 'advance' key, the bot will go to the next step without waiting for a new message
//
// post_process functions can send follow-up information based on the user object
// by returning a 'msg' key
//
// note that `msg` strings can template in variables of user data. eg:
//   msg: 'hello {{fullname}}! how is the weather in {{settings.city}}?'

var default_steps = {
	
	intro: {
		msg: "Hi, this is HelloVote! I'm going to help you register to vote. I'll ask a few questions to fill out your registration form. Your answers are private and secure.",
		process: function() { return Promise.delay(config.bot.advance_delay, {'next': 'first_name'})}
	},
	first_name: {
		process: simple_store('user.first_name')
	},
	last_name: {
		process: simple_store('user.last_name')
	},
	zip: {
		// create a binding for the user now that we have identity
		pre_process: function(action, conversation, user) {
			if (config.twilio) notify.add_tags(user, ['votebot-started']);
		},
		process: simple_store('user.settings.zip', {validate: validate.zip})
	},
	city: {
		pre_process: function(action, conversation, user) {
			if(util.object.get(user, 'settings.city')) return {next: 'state'};
		},
		process: simple_store('user.settings.city')
	},
	state: {
		pre_process: function(action, conversation, user) {
			if(util.object.get(user, 'settings.state')) return {next: 'address'};
		},
		process: simple_store('user.settings.state', {validate: validate.state}),
		post_process: function(user) {
			var state = util.object.get(user, 'settings.state');

			// check state eligibility requirements
			if (end_msg = us_election.states_without_ovr[state]) {
				if (config.twilio) notify.replace_tags(user, ['votebot-started'], ['votebot-completed']);
				return {msg: end_msg, next: 'share'}
			}

			// and online registration deadlines
			if (deadline_str = us_election.get_ovr_deadline(state)) {
				var ovr_deadline = moment(deadline_str, 'YYYY-MM-DD');
				var today = moment();
				if (today.isAfter(ovr_deadline, 'day')) {
					return {msg: 'Sorry, the online voter registration deadline for {{settings.state}} has passed. You may still be eligible to register to vote in person', next: 'share'}
				}
			}
			return {}
		}
	},
	address: {
		pre_process: function(action, conversation, user) {
			if (config.twilio) notify.add_tags(user, [user.settings.state]);
		},
		process: simple_store('user.settings.address', {validate: validate.address})
	},
	apartment: {
		pre_process: function(action, conversation, user) {
			if (util.object.get(user, 'settings.address_needs_apt')) return {}
			else return {next: 'date_of_birth', advance: true}
		},
		process: simple_store('user.settings.address_unit', {validate: validate.address_unit})
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
		process: simple_store('user.settings.date_of_birth', {validate: validate.date}),
		post_process: function(user) {
			// if today is their birthday, send a cake
			var date_of_birth = moment(util.object.get(user, 'settings.date_of_birth'), 'YYYY-MM-DD');
			var today = moment();
			if (today.format('MM/DD') === date_of_birth.format('MM/DD')) {
				return {msg: 'Happy birthday! \u{1F382}'};
			} else {
				return {}
			}
		}
	},
	email: {
		pre_process: function(action, conversation, user) {
			// send email prompt dependent on user state
			var state = util.object.get(user, 'settings.state');
			if (us_election.state_required_questions[state]) {
				return {msg: "Almost done! Now, {{settings.state}} requires an email for online registration. We'll also send you crucial voting information. What's your email?"};
			} else {
				return {msg: "Almost done! Now, {{settings.state}} requires you to print, sign, and mail a form. We’ll email it to you, along with crucial voting information. What's your email?"};
			}
		},
		no_msg: true,
		process: simple_store('user.settings.email', {validate: validate.email})
	},
	// this is a MAGICAL step. it never actually runs, but instead just
	// points to other steps until it runs out of per-state questions to
	// ask. then it parties.
	per_state: {
		pre_process: function(action, conversation, user) {
			var state = util.object.get(user, 'settings.state');
			var state_questions = us_election.state_required_questions[state] || us_election.required_questions_default;
			var next_default = {next: 'confirm'};

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
	confirm: {
		// msg: 'The name and address we have for you is:\n {{first_name}} {{last_name}}, {{settings.address}} {{settings.city}} {{settings.state}}\n Is this correct?',
		process: function(body, user) {
			var next = 'submit';
			if (language.is_no(body)) {
				next = 'incomplete';
			}
			return Promise.resolve({next: next, advance: true});
		}
	},
	submit: {
		pre_process: function(action, conversation, user) {
			// check to ensure user has all required fields before submitting
			var missing_fields = validate.voter_registration_complete(user.settings);
			if (missing_fields.length) {
				// incomplete, re-query missing fields
				log.error('bot: missing fields!', user.username, missing_fields);
				update_user = util.object.set(user, 'settings.missing_fields', response.errors);
				user_model.update(user.id, update_user);
				return {next: 'incomplete'};
			}
		},
		process: function(body, user) {
			if (!config.submit_url) {
				log.info('bot: no submit_url in config, skipping submit...');
				return Promise.resolve({
					next: 'complete',
					msg: 'This system is in DEBUG mode, skipping form submission to state. Still clearing sensitive user fields.',
					store: {
						'settings.submit': 'skipped',
						'settings.ssn': 'cleared',
						'settings.state_id_number': 'cleared'
					}
				});
			};

			// send to votebot-forms
			var form_submit = {
			    method: 'POST',
			    uri: config.submit_url,
			    body: {
			    	user: user,
			    	callback_url: '' // TODO, define callback to notify user of form submit success
			    },
			    json: true 
			};

			return request(form_submit)
			      .then(function (response) {
			    	log.info('form submit response', response);
					if (response.status === 'error') {
						log.error('form-submit: error!', user.username, response.errors);
						update_user = util.object.set(user, 'settings.missing_fields', response.errors);
						user_model.update(user.id, update_user);

						return Promise.resolve({next: 'incomplete'});
					} else {
						// store submit response, remove SSN or state ID from our data
						return Promise.resolve({
								next: 'complete',
								store: {
									'settings.submit': response.status,
									'settings.ssn': 'cleared',
									'settings.state_id_number': 'cleared'
								}
						});
					}
			    })
			    .catch(function (error) {
			        log.error('error submitting', error);
					return Promise.resolve({next: 'incomplete', 'errors': [error]});
			    });
		},
	},
	complete: {
		pre_process: function(action, conversation, user) {
			if (config.twilio) notify.replace_tags(user, ['votebot-started'], ['votebot-completed']);

			// send confirmation prompt dependent on user state
			var state = util.object.get(user, 'settings.state');
			if (us_election.state_required_questions[state]) {
				// registration complete online, no extra instructions
				return {msg: 'Congratulations! We have submitted your voter registration in {{settings.state}}! We just emailed you a receipt.', next: 'share'};
			} else {
				// they'll get a PDF, special instructions
				return {msg: "Great! In a moment, we’ll email you a completed voter registration form to print, sign, and mail.", next: 'share'};
			}
		},
		advance: true,
		process: simple_store('user.settings.complete', {validate: validate.always_true}),
	},
	incomplete: {
		// msg: 'Sorry, your registration is incomplete. Restart?',
		process: function(body, user) {
			// TODO, re-query missing fields
			log.error('missing fields', util.object.get(user, 'settings.missing_fields'));
			var next = 'incomplete';
			if (language.is_yes(body) || body.trim().toUpperCase() === 'RESTART') {
				next = 'restart';
			}
			return Promise.resolve({next: next});
		}
	},
	share: {
		process: function() { return Promise.resolve({})}, // no-op
		advance: true,
	},
	fftf_opt_in: {
		pre_process: function(action, conversation, user) {
			// delay sending by a few minutes
			var opt_in_delay = 3*60*1000; // ms
			return Promise.delay(opt_in_delay, {next: 'fftf_opt_in_thanks'});
		},
		process: simple_store('user.settings.fftf_opt_in', {validate: validate.boolean}),
	},
	restart: {
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
		process: simple_store('user.settings.us_citizen', {validate: validate.boolean_yes})
	},
	legal_resident: {
		process: simple_store('user.settings.legal_resident', {validate: validate.boolean_yes})
	},
	will_be_18: { 
		pre_process: function(action, conversation, user) {
			// if user has already told us their birthdate, calculate will_be_18 automatically
			if( util.object.get(user, 'settings.date_of_birth') ) {
				var date_of_birth = moment(util.object.get(user, 'settings.date_of_birth'), 'YYYY-MM-DD');
				var next_election = moment(config.election.date, 'YYYY-MM-DD');
				var cutoff_date = moment(next_election).year(next_election.year() - 18);
				var will_be_18 = cutoff_date.isAfter(date_of_birth);
				// persist to user object
				var update_user = util.object.set(user, 'settings.will_be_18', will_be_18);
				// and database
				user_model.update(user.id, update_user);
				return {next: 'per_state'};
			}
		},
		process: simple_store('user.settings.will_be_18', {validate: validate.boolean_yes})
	},
	ethnicity: {
		process: simple_store('user.settings.ethnicity')
	},
	political_party: {
		process: simple_store('user.settings.political_party')
	},
	disenfranchised: {
		process: simple_store('user.settings.disenfranchised', {validate: validate.boolean_no})
	},
	incompetent: {
		process: simple_store('user.settings.incompetent', {validate: validate.boolean_no})
	},
	state_id_number: {
		process: simple_store('user.settings.state_id_number', {validate: validate.state_id_number})
	},
	state_id_issue_date: {
		process: simple_store('user.settings.state_id_issue_date', {validate: validate.date})
	},
	ssn: {
		process: simple_store('user.settings.ssn', {validate: validate.ssn})
	},
	ssn_last4: {
		process: simple_store('user.settings.ssn_last4', {validate: validate.ssn_last_4})
	},
	state_id_or_ssn_last4: {
		process: simple_store('user.settings.state_id_or_ssn_last4')
	},
	gender: {
		process: simple_store('user.settings.gender', {validate: validate.gender})
	},
	county: {
		process: simple_store('user.settings.county')
	},
	consent_use_signature: {
		process: simple_store('user.settings.consent_use_signature', {validate: validate.boolean_yes})
	},
	mail_in: {
		process: simple_store('user.settings.mail_in', {validate: validate.boolean})
	},
};

function get_chain(type) {
	var vars = {type: type};
	return db.query('SELECT * FROM chains WHERE name = {{type}}', vars).then(function(chain) {
		if (chain.length == 0)
			return Promise.resolve(null);

		chain = chain[0];
		return Promise.resolve(chain);
	});
}

function get_chain_step(type, step) {
	var vars = {chain_name: type, step_name: step};
	var qry = [
		'SELECT',
		'	cs.*',
		'FROM',
		'	chains_steps cs',
		'INNER JOIN',
		'	chains c',
		'ON',
		'	cs.chain_id = c.id',
		'WHERE',
		'	cs.name = {{step_name}}',
		'AND',
		'	c.name = {{chain_name}}'
	];

	return db.query(qry.join('\n'), vars).then(function(step) {
		if (step.length == 0)
			return Promise.resolve(null);

		step = step[0];
		var overridden_default = {};

		if (typeof default_steps[step.name] !== 'undefined')
			overridden_default = default_steps[step.name];

		for (var key in step)
			if (step.hasOwnProperty(key))
				overridden_default[key] = step[key];

		return Promise.resolve(overridden_default);
	});
}

function log_chain_step_entry(step_id) {
	var vars = {id: step_id},
	    qry = "UPDATE chains_steps SET entries = entries + 1 WHERE ID = {{id}}";
	return db.query(qry, vars);
}

function log_chain_step_exit(step_id) {
	var vars = {id: step_id},
	    qry = "UPDATE chains_steps SET exits = exits + 1 WHERE ID = {{id}}";
	return db.query(qry, vars);
}

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
	if(language.is_help(body)) return Promise.resolve({next: '_help', prev: step.name});

	return step.process(body, user, step.next, step.errormsg);
};

/**
 * given an action, conversation, and user objects, determine the next step in
 * the conversation chain to load.
 */
var find_next_step = function(action, conversation, user)
{
	var preserve_action = util.object.merge({}, action);
	var state = conversation.state;
	var next = preserve_action.next;
	
	return get_chain_step(state.type, next).then(function(nextstep) {
		if(!nextstep) throw new Error('bot: could not load step: ', state.type, next);

		var default_step = {step: nextstep, name: next};
		
		// check nextstep for pre_process
		if (nextstep.pre_process) {
			var res = nextstep.pre_process(preserve_action, conversation, user);
			// if our pre_process returns a "msg" key, then we should send it immediately
			if (res && res.msg) {
				message_model.create(config.bot.user_id, conversation.id, {body: language.template(res.msg, user)});
			}
			if (res && res.next)
				var processed_next = res.next;
		}

		// same for post_process
		if (nextstep.post_process) {
			var res = nextstep.post_process(user);
			if (res && res.msg) {
				message_model.create(config.bot.user_id, conversation.id, {body: language.template(res.msg, user)});
			}
			// note that if post_process returns a next key it will override the pre_process function's
			if (res && res.next)
				var processed_next = res.next;
		}

		if(processed_next) {
			// if either processing function returned a "next" key, then we know we should load
			// another step. wicked. recurse and find that shit.
			var next_action = util.object.merge({}, preserve_action, {next: processed_next});
			return find_next_step(next_action, conversation, user);
		} else {
			
			if (default_step.step && default_step.step.id)
				log_chain_step_entry(default_step.step.id);

			return default_step;
		}
	});
};

/**
 * start a bot-initiated conversation, or continue a web-initiated one
 */
exports.start = function(type, to_user_id, options)
{
	options || (options = {});
	var user;
	var first_step_name;
	return user_model.get(to_user_id).then(function(_user) {
		user = _user;
		if(!user) throw error('user '+to_user_id+' was not found');

		return get_chain(type).then(function(chain) {
			if(!chain) throw new Error('bot: error loading chain: '+type);

			first_step_name = options.start || chain.start;

			return get_chain_step(type, first_step_name);

		}).then(function(step) {
			
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
				}).then(function(conversation) {
					log.info('about to send first message! conversation: ', conversation.id);
					message_model.create(
						config.bot.user_id,
						conversation.id,
						{ body: step.msg }
					)
					return conversation;
				}).then(function(conversation) {
					if (step.advance) {
						// advance conversation to next step, without waiting for user
						// delay slightly, to avoid intro messages sending out of order
						Promise.delay(config.bot.advance_delay).then(function() {
							return exports.next(user.id, conversation, {
								user_id: user.id,
								conversation_id: conversation.id,
								body: '', // empty body, because it's a fake message
								created: db.now()
							});
						});
					}
				});
			}
		});
	});
};

/**
 * processes an incoming message to our beloved bot. handles loading the convo
 * state, parsing/processing the user's incoming message, and loading the next
 * chain in the conversation.
 */
exports.next = function(user_id, conversation, message)
{
	var user,
	    step,
		state;

	return user_model.get(user_id)
		.then(function(_user) {
			user = _user;
			if(!user) throw error('user '+user_id+' was not found');
			state = conversation.state;
			return get_chain_step(state.type, state.step);
		})
		.then(function(_step) {
			if(!_step) throw error('conversation chain missing: ', state.step);

			step = _step;

			log_chain_step_exit(step.id);

			// only get the restart step if we're on the final step, lol
			if (step.final)
				return get_chain_step(state.type, 'restart');
			else
				return null;
		})
		.then(function(_restart) {

			var body = message.body;

			// we've reached the final step
			if(step.final)
			{
				log.info('bot: recv msg, but conversation finished');
				if (validate.boolean(body)) {
					log.info('bot: user wants to restart');
					step = _restart;
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
					if(action.next == '_cancel') {
						var stop_msg = 'You are unsubscribed from FightForTheFuture. No more messages will be sent. Reply HELP for help or 844-344-3556.';
						message_model.create(config.bot.user_id, conversation.id, {body: stop_msg});
						if (config.twilio) { notify.delete_binding(user); }
						return convo_model.close(conversation.id);
					}
					if(action.next == '_help') {
						var help_msg = 'FightForTheFuture: Help at hellovote.org or 844-344-3556. Msg&data rates may apply. Text STOP to cancel.'
						message_model.create(config.bot.user_id, conversation.id, {body: help_msg});
						// let user continue
						action.next = action.prev; 
					}

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

					if (step.post_process) {
						// send post-process message for user
						promise = promise
							.then(function() {
								var res = step.post_process(user);
								if (res && res.msg) {
									message_model.create(config.bot.user_id, conversation.id, {body: language.template(res.msg, user)});
								}
								if (res && res.next) {
									action.next = res.next;
								}
							});
					}

					// we're processing the next step, inject some steps
					// into the promise chain
					promise = promise
						.then(function() {
							// get our next step from the conversation chain
							return find_next_step(action, conversation, user);
						})
						.then(function(found) {
							var nextstep = found.step;

							// destructively modify our conversation state object,
							// replacing the "step" value with our new step's name.
							// this will get saved once our message goes out
							state.step = found.name;

							// create/send the message from the next step in the convo chain
							if (nextstep.msg && !nextstep.no_msg) {
								return message_model.create(config.bot.user_id, conversation.id, {body: language.template(nextstep.msg, user)});
							}
						})
						.then(function() {
							// save our current state into the conversation so's
							// we know where we left off when the next message
							// comes in
							return convo_model.update(conversation.id, {state: state});
						});

					if(action.advance) {
						// advance to next step, without waiting for user response
						// delay slightly 
						promise = promise
							.delay(config.bot.advance_delay)
							.then(function() {
								// construct empty message
								return exports.next(user.id, conversation, {
									user_id: user.id,
									conversation_id: conversation.id,
									body: '', // empty body, because it's a fake message
									created: db.now()
								});
							});
					}

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

					if(message)
						return message_model.create(config.bot.user_id, conversation.id, {body: message});
				})
				// error catching errors. ABORT
				.catch(function(err) {
					log.crit('bot: fatal (giving up): ', err, err.stack);
				});
		});
};

