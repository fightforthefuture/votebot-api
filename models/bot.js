var Promise = require('bluebird');
var config = require('../config');
var db = require('../lib/db');
var convo_model = require('./conversation');
var submission_model = require('./submission');
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
var l10n = require('../lib/l10n');

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
		process: function() { return Promise.resolve({'next': 'first_name'})}
	},
	// JL NOTE ~ this step is not in any chain. It's initiated via Facebook messenger
	intro_facebook: {
		name: 'intro_facebook',
		advance: true,
		msg: l10n('msg_intro_facebook'),
		next: 'first_name',
		process: function() { return Promise.resolve({'next': 'first_name'})}
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
			if (user_model.use_notify(user.username)) { notify.add_tags(user, ['votebot-started']); }
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
			// if(util.object.get(user, 'settings.state')) return {next: 'address'};
			var state = util.object.get(user, 'settings.state');

			// check state eligibility requirements
			if (state) {
				if (end_msg = us_election.states_without_ovr[state]) {
					if (user_model.use_notify(user.username)) { notify.replace_tags(user, ['votebot-started'], ['votebot-completed']); }
					return {msg: end_msg, next: 'share'}
				}

				// and online registration deadlines
				if (deadline_str = us_election.get_ovr_deadline(state)) {
					var ovr_deadline = moment(deadline_str, 'YYYY-MM-DD');
					var today = moment();
					if (today.isAfter(ovr_deadline, 'day')) {
						return {msg: l10n('error_state_deadline_expired', conversation.locale), next: 'share'}
					}
				}

				return {next: 'address'}
			}
			return {}
		},
		process: simple_store('user.settings.state', {validate: validate.state})
	},
	address: {
		pre_process: function(action, conversation, user) {
			if (user_model.use_notify(user.username)) { notify.add_tags(user, [user.settings.state]); }
		},
		process: simple_store('user.settings.address', {validate: validate.address}),
		post_process: function(user, conversation) {

			if (util.object.get(user, 'settings.address_appears_bogus')) {
				var err_meta = {
					address: util.object.get(user, 'settings.address'),
					zip: util.object.get(user, 'settings.zip'),
					user_id: user.id.toString()
				}
				log.notice('bot: ADDRESS WARNING', err_meta);
				return {msg: l10n('msg_address_appears_bogus', conversation.locale)};
			} else {
				return {}
			}
		}
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
			if (user_model.use_notify(user.username)) {
				notify.add_identity(user, {
					address: user.settings.address,
					city: user.settings.city,
					state: user.settings.state
				});
			}
		},
		process: simple_store('user.settings.date_of_birth', {validate: validate.date}),
		post_process: function(user, conversation) {
			// if today is their birthday, send a cake
			var date_of_birth = moment(util.object.get(user, 'settings.date_of_birth'), 'YYYY-MM-DD');
			var today = moment();
			if (today.format('MM/DD') === date_of_birth.format('MM/DD')) {
				return {msg: l10n('msg_happy_birthday', conversation.locale)};
			} else {
				return {}
			}
		}
	},
	will_be_18: { 
		pre_process: function(action, conversation, user) {
			// if user has already told us their birthdate, calculate will_be_18 automatically
			if( util.object.get(user, 'settings.date_of_birth') ) {
				var date_of_birth = moment(util.object.get(user, 'settings.date_of_birth'), 'YYYY-MM-DD');
				var next_election = moment(config.election.date, 'YYYY-MM-DD');
				var cutoff_date = moment(next_election).year(next_election.year() - 18);
				var will_be_18 = cutoff_date.isAfter(date_of_birth);

				if (!will_be_18) {
					// sorry, you're inelgible
					return {next: 'ineligible'};
				}

				// persist to user object
				var update_user = util.object.set(user, 'settings.will_be_18', will_be_18);
				// and database
				user_model.update(user.id, update_user);
				return {next: 'email'};
			}
		},
		process: simple_store('user.settings.will_be_18', {validate: validate.boolean_yes})
	},
	email: {
		pre_process: function(action, conversation, user) {
			// send email prompt dependent on user state
			var state = util.object.get(user, 'settings.state');
			if (us_election.state_required_questions[state]) {
				return {msg: l10n('prompt_email_for_ovr', conversation.locale)};
			} else {
				return {msg: l10n('prompt_email_for_pdf', conversation.locale)};
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
			var next_default = {next: 'confirm_name_address'};

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
	// JL NOTE ~ JL TODO ~ this step is not in any chain. Yet. It should be.
	ovr_disclosure: {
		name: 'ovr_disclosure',
		pre_process: function(action, conversation, user) {
			var state = util.object.get(user, 'settings.state');
			var disclosure = us_election.state_confirmation_disclosures[state].text;
			return {
				msg: l10n('prompt_ovr_disclosure', conversation.locale)+': "'+disclosure+'"',
				next: 'confirm_ovr_disclosure',
				advance: true,
				delay: true
			}
		},
		no_msg: true,
	},
	// JL NOTE ~ JL TODO ~ this step is not in any chain. Yet. It should be.
	confirm_ovr_disclosure: {
		name: 'ovr_disclosure', // JL HACK ~ override the name to go back to the previous
		pre_process: function(action, conversation, user) {
			var state = util.object.get(user, 'settings.state');
			var url = us_election.state_confirmation_disclosures[state].url;
			return {
				msg: l10n('prompt_confirm_ovr_disclosure', conversation.locale).replace('{url}', url)
			}
		},
		process: function(body, user) {
			var state = util.object.get(user, 'settings.state');
			var store = us_election.state_confirmation_disclosures[state].store;
			if (language.is_yes(body)) {
				var update_user = util.object.set(user, 'settings.confirm_ovr_disclosure', true);
				user_model.update(user.id, update_user);
			} else {
				return Promise.resolve({next: 'restart'});				
			}
			return Promise.resolve({
				next: 'submit',
				advance: true,
				store: store
			});
		},
		no_msg: true,
	},
	confirm_name_address: {
		// msg: 'The name and address we have for you is:\n {{first_name}} {{last_name}}, {{settings.address}} {{settings.city}} {{settings.state}}\n Is this correct?',
		process: function(body, user) {
			if (language.is_yes(body)) {
				var update_user = util.object.set(user, 'settings.confirm_name_address', true);
				user_model.update(user.id, update_user);				
			} else {
				return Promise.resolve({next: 'restart'});
			}
			return Promise.resolve({next: 'submit', advance: true});
		}
	},
	submit: {
		pre_process: function(action, conversation, user) {
			// check to ensure user has all required fields before submitting
			//
			// JL NOTE ~ How would this ever work?
			// The validate.voter_registration_complete method is not synchronous,
			// but we are treating it as such.
			//
			// Also, it tries to update the user with a "response.errors" object.
			// There is no such object in the scope of this method. It appears to
			// be duplicate code from the submit.process step. Disabling because it
			// does not pass my mental sanity check. Plus I'm changing the format
			// of the missing_fields object anyway.
			//
			/*
			var missing_fields = validate.voter_registration_complete(user.settings, conversation.locale);
			if (missing_fields.length) {
				// incomplete, re-query missing fields
				log.error('bot: submit: missing fields! ', missing_fields, {step: 'submit', username: user.username});
				update_user = util.object.set(user, 'settings.missing_fields', response.errors);
				user_model.update(user.id, update_user);
				return {next: 'incomplete'};
			}
			*/
		},
		process: function(body, user, step, conversation) {
			if (!config.app.submit_ovr_url || !config.app.submit_vote_dot_org_url) {
				log.info('bot: no submit_url in config, skipping submit...');
				return Promise.resolve({
					next: 'complete',
					msg: 'This system is in DEBUG mode, skipping form submission to state. Still clearing sensitive user fields.',
					store: {
						'user.settings.submit': 'skipped',
						'user.settings.ssn': 'cleared',
						'user.settings.state_id_number': 'cleared'
					}
				});
			};

			var state = util.object.get(user, 'settings.state');
			var failed_ovr = util.object.get(user, 'settings.failed_ovr');
			if (us_election.state_required_questions[state] && !failed_ovr) {
				log.info('bot: sending OVR submission...');
				var url = config.app.submit_ovr_url;
			} else {
				log.info('bot: sending Vote.org submission...');
				var url = config.app.submit_vote_dot_org_url;
			}

			var submission;
			var body = {
			    	user: user,
			    	callback_url: config.app.url + '/receipt/'+user.username
			    };

			return submission_model.create(user.id, conversation.id, url, body)
				.then(function(_submission) {
					submission = _submission;

					// send to votebot-forms
					var form_submit = {
					    method: 'POST',
					    uri: url,
					    body: body,
					    json: true 
					};
					return request(form_submit);
				}).then(function (response) {
			    	log.info('bot: form_submit: response', response);
			    	log.info('bot: saving response uid ', response.uid);

			    	submission_model.update(submission.id, {
			    		form_stuffer_reference: response.uid
			    	});

			    	var update_user = util.object.set(user, 'submit', true);
			    	user_model.update(user.id, update_user);

			    	return Promise.resolve({
						next: 'processing',
					});
			    })
			    .catch(function (error) {
			        log.error('bot: form_submit: unable to post ', {step: 'submit', error: error.error});
					var update_user = util.object.set(user, 'settings.submission_error', error.error);
					user_model.update(user.id, update_user);

					return Promise.resolve({next: 'incomplete'});
			    });
		},
	},
	// JL NOTE ~ this step is not in any chain. It doesn't really need to be.
	processing: {
		next: 'processing',
		msg: l10n('msg_processing'),
		process: function(body, user) {
			return Promise.resolve({next: 'processing'});
		}
	},
	processed: {
		next: 'complete',
		msg: '',
		advance: true,
		process: function(body, user) {
			return Promise.resolve({
				next: 'complete',
				// JL NOTE ~ disabled for beta test
				/*
				store: {

					'user.settings.submit': true,
					'user.settings.ssn': 'cleared',
					'user.settings.state_id_number': 'cleared'
				}
				*/
			});
		}
	},
	complete: {
		pre_process: function(action, conversation, user) {
			if (user_model.use_notify(user.username)) { notify.replace_tags(user, ['votebot-started'], ['votebot-completed']); }

			// send confirmation prompt dependent on user state
			var form_type = util.object.get(user, 'settings.submit_form_type');

			if (form_type != 'VoteDotOrg') {
				// registration complete online, no extra instructions
				return {msg: l10n('msg_complete_ovr', conversation.locale), next: 'share'};
			} else {
				// they'll get a PDF, special instructions
				return {msg: l10n('msg_complete_pdf', conversation.locale), next: 'share'};
			}
		},
		advance: true,
		process: function(body, user) {
			return Promise.resolve({next: 'share'});
		}
	},
	incomplete: {
		pre_process: function(action, conversation, user) {
			var failed = util.object.get(user, 'settings.failed_vote_dot_org');
			if (failed) {
				var ref = util.object.get(user, 'settings.failure_reference');
				return {
					msg: l10n('msg_error_failed', conversation.locale)+' '+ref
				}
			}

			var submission_error = util.object.get(user, 'settings.submission_error');
			if (!submission_error)
				return {};

			if (submission_error.error_type === 'missing_fields' && submission_error.payload.length) {
				var next = Object.keys(submission_error.payload[0])[0]; // weird deserialize format from python...
				return {msg: l10n('error_incomplete', conversation.locale), next: next};
			} else if (submission_error.message === 'internal_error') {
				return {msg: l10n('msg_error_failed', conversation.locale), next: 'incomplete'}
			} else {
				return {}
			}
		},
		// msg: 'Sorry, your registration is incomplete. Restart?',
		process: function(body, user, step, conversation) {
			// TODO, re-query missing fields
			log.notice('bot: incomplete: submission_error ', util.object.get(user, 'settings.submission_error'), {user_id: user.id.toString()});
			if (language.is_yes(body) || body.trim().toUpperCase() === 'RESTART') {
				return Promise.resolve({next: 'restart'});
			}
			if (body.trim().toUpperCase() === 'RETRY') {
				return Promise.resolve({next: 'submit', msg: l10n('msg_trying_again', conversation.locale), advance: true});
			}
			return Promise.resolve({next: 'incomplete'});
		}
	},
	share: {
		process: function() { return Promise.resolve({'next': 'fftf_opt_in'})},
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
	military_or_overseas: {
		process: simple_store('user.settings.military_or_overseas', {validate: validate.military_or_overseas})
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
	disqualified: {
		process: simple_store('user.settings.disqualified', {validate: validate.boolean_no})
	},
	incompetent: {
		process: simple_store('user.settings.incompetent', {validate: validate.boolean_no})
	},
	phone: {
		pre_process: function(action, conversation, user) {
			// save phone from SMS
			var username = user_model.parse_username(user.username);
			if (username.type === 'sms') {
				var update_user = util.object.set(user, 'settings.phone', username.username);
				user_model.update(user.id, update_user);
			}
			return Promise.resolve({next: 'per_state'});
		},
		process: simple_store('user.settings.phone', {validate: validate.phone})
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
	vote_by_mail: {
		process: simple_store('user.settings.vote_by_mail', {validate: validate.boolean})
	},
	ineligible: {
		process: simple_store('user.settings.ineligible', {validate: validate.always_true})
	},

	// JL NOTE ~ added per state questions for illinois but not yet to form
	has_previous_address: {
		name: 'has_previous_address',
		msg: l10n('prompt_has_previous_address'),
		process: function(body, user) {
			var next = 'per_state';

			if (language.is_yes(body)) {
				var update_user = util.object.set(user, 'settings.has_previous_address', true);
				var next = 'previous_address';
			} else {
				var update_user = util.object.set(user, 'settings.has_previous_address', false);
			}

			return user_model.update(user.id, update_user).then(function() {;
				return Promise.resolve({next: next})
			});
		},
	},

	previous_address: {
		name: 'previous_address',
		msg: l10n('prompt_previous_address'),
		process: simple_store('user.settings.previous_address'),
		next: 'per_state'
	},

	has_previous_name: {
		name: 'has_previous_name',
		msg: l10n('prompt_has_previous_name'),
		process: function(body, user) {
			var next = 'per_state';

			if (language.is_yes(body)) {
				var update_user = util.object.set(user, 'settings.has_previous_name', true);
				var next = 'previous_name';
			} else {
				var update_user = util.object.set(user, 'settings.has_previous_name', false);
			}

			return user_model.update(user.id, update_user).then(function() {;
				return Promise.resolve({next: next})
			});
		},
	},

	previous_name: {
		name: 'previous_name',
		msg: l10n('prompt_previous_name'),
		process: simple_store('user.settings.previous_name'),
		next: 'per_state'
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

function get_chain_step(type, stepName) {
	var vars = {chain_name: type, step_name: stepName};
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
			if (typeof default_steps[stepName] !== 'undefined')
				return Promise.resolve(default_steps[stepName]);
			else
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
	if (!step_id)
		return Promise.resolve();
	var vars = {id: step_id},
	    qry = "UPDATE chains_steps SET entries = entries + 1 WHERE ID = {{id}}";
	return db.query(qry, vars);
}

function log_chain_step_exit(step_id) {
	if (!step_id)
		return Promise.resolve();
	var vars = {id: step_id},
	    qry = "UPDATE chains_steps SET exits = exits + 1 WHERE ID = {{id}}";
	return db.query(qry, vars);
}

// a helper for very simple ask-and-store type questions.
// can perform data validation as well.
function simple_store(store, options)
{
	options || (options = {});

	return function(body, user, step, conversation)
	{
		// if we get an empty body, error
		if(!body.trim()) return validate.data_error(step.errormsg, {promise: true});

		var obj = {};
		obj[store] = body;
		var promise = Promise.resolve({next: step.next, store: obj});
		if(options.validate)
		{
			promise = options.validate(body, user, conversation.locale)
				.spread(function(body, extra_store) {
					log.info('bot: validated body: ', body, '; extra_store: ', extra_store);
					extra_store || (extra_store = {});
					extra_store[store] = body;
					return {next: step.next, store: extra_store};
				});
		}
		return promise;
	};
}

var parse_step = function(step, body, user, conversation)
{
	// if the user is canceling, don't bother parsing anything
	if(language.is_cancel(body)) return Promise.resolve({next: '_cancel'});
	if(language.is_help(body)) return Promise.resolve({next: '_help', prev: step.name});
	if(language.is_back(body)) return Promise.resolve({next: '_back'});

	return step.process(body, user, step, conversation);
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
		if(!nextstep) throw new Error('bot: could not load step: '+ next);

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
			if (res && res.delay)
				var processed_next_delay = true;
		}

		// same for post_process
		// JL NOTE ~ this code is duplicated and was causing problems.
		/*
		if (nextstep.post_process) {
			var res = nextstep.post_process(user, conversation);
			if (res && res.msg) {
				message_model.create(config.bot.user_id, conversation.id, {body: language.template(res.msg, user)});
			}
			// note that if post_process returns a next key it will override the pre_process function's
			if (res && res.next)
				var processed_next = res.next;
		}
		*/

		if(processed_next) {
			// if either processing function returned a "next" key, then we know we should load
			// another step. wicked. recurse and find that shit.
			var next_action = util.object.merge({}, preserve_action, {next: processed_next});

			if (!processed_next_delay)
				return find_next_step(next_action, conversation, user);
			else
				return Promise.delay(config.bot.advance_delay).then(function() {
					return find_next_step(next_action, conversation, user);
				});
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
					type: 'sms',
					state: {type: type, step: first_step_name},
					recipients: [user],
					message: { body: step.msg }
				});
			} else {
				convo_model.update(options.existing_conversation_id, {
					state: {type: type, step: first_step_name},
				}).then(function(conversation) {
					log.info('about to send first message! conversation:', conversation.id);
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
							return exports.next(user.id, conversation);
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

	if (!message)
		message = {
			user_id: user_id,
			conversation_id: conversation.id,
			body: '', // empty body, because it's a fake message
			created: db.now()
		};

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
					var restart_msg = l10n('prompt_restart_after_complete', conversation.locale)
					return message_model.create(config.bot.user_id, conversation.id, {body: language.template(restart_msg, user)});
				}
			}
			
			return parse_step(step, body, user, conversation)
				.then(function(action) {
					log.info('bot: action:', JSON.stringify(action));

					log_chain_step_exit(step.id);

					// if user wants out, let them
					if(action.next == '_cancel') {
						var stop_msg = l10n('msg_unsubscribed', conversation.locale);
						message_model.create(config.bot.user_id, conversation.id, {body: stop_msg});
						if (user_model.use_notify(user.username)) { notify.delete_binding(user); }
						return convo_model.close(conversation.id);
					}
					if(action.next == '_help') {
						var help_msg = l10n('msg_help', conversation.locale);
						message_model.create(config.bot.user_id, conversation.id, {body: help_msg});
						// let user continue
						action.next = action.prev; 
					}
					if(action.next == '_back') {
						log.info('bot: going back to '+state.back);
						action.next = state.back;
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
								var res = step.post_process(user, conversation);
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

							log.info('bot: user: ', user);

							// get our next step from the conversation chain
							return find_next_step(action, conversation, user);
						})
						.then(function(found) {
							var nextstep = found.step;

							// destructively modify our conversation state object,
							// replacing the "step" value with our new step's name.
							// this will get saved once our message goes out
							state.step = found.name;
							// save current step, in case the user wants to go back
							state.back = step.name;

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
								return exports.next(user.id, conversation);
							});
					}

					// all done
					return promise;
				})
				// catches ALL errors, whether in validation or in code.
				.catch(function(err) {
					if(err.data_error)
					{
						var err_meta = {
							step: step.name,
							body: body,
							message: err.message
						};

						// normally we try to separate validation errors from user context
						// but some are easier to debug if we have a few related fields
						if (step.name === 'state_id_number') { err_meta['state'] = user.settings.state; }
						if (step.name === 'address') {
							err_meta['city'] = user.settings.city;
							err_meta['state'] = user.settings.state;
							err_meta['zip'] = user.settings.zip;
						}
						if (step.name === 'apartment') {
							err_meta['address'] = user.settings.address;
						 	err_meta['city'] = user.settings.city;
						 	err_meta['state'] = user.settings.state;
						}
						err_meta['user_id'] = user.id.toString();

						log.notice('bot: data_error:', step.name, err_meta);
						if (err.message)
						{
							var message = err.message;
						} else {
							var message = l10n('msg_try_again', conversation.locale);
						}

						if(err.end_conversation)
						{
							var message = l10n('prompt_ineligible', conversation.locale);
						}
					}
					else
					{
						log.error('bot: non data_error:', err, {step: step.name});
						var message = l10n('msg_error_unknown', conversation.locale);
					}

					if(message)
						return message_model.create(config.bot.user_id, conversation.id, {body: message});
				})
				// error catching errors. ABORT
				.catch(function(err) {
					log.crit('bot: fatal (giving up): ', err.message, {step: step.name, stack: err.stack});
				});
		});
};

