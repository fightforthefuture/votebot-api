var Promise = require('bluebird');
var config = require('../config');
var db = require('../lib/db');
var convo_model = require('./conversation');
var submission_model = require('./submission');
var message_model = require('./message');
var existing_registration = require('./existing_registration');
var facebook_model = require('./facebook');
var user_model = require('./user');
var attrition_model = require('./attrition');
var street_address_model = require('./street_address');
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
var momentTZ = require('moment-timezone');
var l10n = require('../lib/l10n');
var partners = require('../config.partners');

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
	intro_facebook: {
		process: function() { return Promise.resolve({'next': 'first_name'})}
	},
	first_name: {
		pre_process: function(action, conversation, user) {
			if (conversation.type == 'fb')
				return { msg: l10n('prompt_first_name_fb', conversation.locale) }
			else
				return { msg: l10n('prompt_first_name', conversation.locale) }
		},
		process: function(body, user, step, conversation) {
			if (language.is_yes(body.trim())) {
				return Promise.resolve({
					next: 'first_name',
					msg: l10n('error_first_name', conversation.locale)
				});
			}
			var result = {
				next: 'last_name',
				store: { 'user.first_name': body.trim() }
			}
			if (body.trim().indexOf(' ') !== -1)
				result.next = 'confirm_first_name';

			return Promise.resolve(result);
		},
	},
	confirm_first_name: {
		process: function(body, user, step, conversation) {
			var next = 'last_name';
			if (!language.is_yes(body.trim())) {
				next = 'first_name';
			}
			return Promise.resolve({
				next: next,
			});
		}
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
		process: simple_store('user.settings.city', {validate: validate.city})
	},
	state: {
		pre_process: function(action, conversation, user) {
			return this.check_eligibility(user);
		},
		check_eligibility: function(user) {
			// check state eligibility requirements
			var state = util.object.get(user, 'settings.state');
			if (state) {
				if (end_msg = us_election.states_without_ovr[state.toUpperCase()]) {
					if (user_model.use_notify(user.username)) { notify.replace_tags(user, ['votebot-started'], ['votebot-completed']); }
					return {
						msg: end_msg,
						next: 'share',
						delay: config.bot.advance_delay
					}
				}

				// and online registration deadlines
				if (deadline_str = us_election.get_ovr_deadline(state)['online']) {
					var ovr_deadline = moment(deadline_str, 'YYYY-MM-DD');
					var today = moment();
					if (today.isAfter(ovr_deadline, 'day')) {
						return {msg: l10n('error_state_deadline_expired', conversation.locale), next: 'share'}
					}
				}

				return {next: 'address'};
			}
		},
		process: simple_store('user.settings.state', {validate: validate.state}),
		post_process: function(user, conversation) {
			// need to also check state eligibility here, in case we didn't short circuit with pre_process
			return this.check_eligibility(user);
		},
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
			var date_of_birth = moment(util.object.get(user, 'settings.date_of_birth'), 'YYYY-MM-DD');
			var today = moment();
			
			// if they are unreasonably old, make them try again
			var age = today.diff(date_of_birth, 'years');
			if (age > 120) {
				var err_meta = {
					user_id: user.id.toString(),
					date_of_birth: util.object.get(user, 'settings.date_of_birth')
				}
				log.notice('bot: DATE_OF_BIRTH WARNING', err_meta);
				return {msg: l10n('msg_date_of_birth_appears_bogus', conversation.locale)};
			}

			// if today is their birthday, send a cake
			if (today.format('MM/DD') === date_of_birth.format('MM/DD')) {
				return {msg: l10n('msg_happy_birthday', conversation.locale)};
			}

			return {}
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
			if (us_election.state_integrated_ovr[state]) {
				return {msg: l10n('prompt_email_for_ovr', conversation.locale)};
			} else {
				return {msg: l10n('prompt_email_for_pdf', conversation.locale)};
			}
		},
		process: simple_store('user.settings.email', {validate: validate.email, advance: true})
	},
	check_existing_registration: {
		process: function(body, user, step, conversation) {
			return existing_registration.verify(user).then(function(registration_status) {
				var next = 'per_state';

				if (registration_status && registration_status[0] === true) {
					// they are already registered
					// mark it
					var update_user = util.object.set(user, 'settings.already_registered', registration_status[0]);
					util.object.set(update_user, 'complete', true);
					user_model.update(user.id, update_user);
					// thank them
					var msg = language.template(l10n('msg_already_registered', conversation.locale), user, conversation.locale);
					message_model.create(config.bot.user_id, conversation.id, {body: msg});
					// and prompt to share
					next = 'share';
				} else {
					// tell them they're not yet registered, to increase urgency
					var msg = language.template(l10n('msg_not_yet_registered', conversation.locale), user, conversation.locale);
					message_model.create(config.bot.user_id, conversation.id, {body: msg});
				}
				return Promise.delay(default_delay(conversation))
					.then(function() {
						return {'next': next}
					});
			});
		}
	},
	// this is a MAGICAL step. it never actually runs, but instead just
	// points to other steps until it runs out of per-state questions to
	// ask. then it parties.
	per_state: {
		pre_process: function(action, conversation, user) {
			var state = util.object.get(user, 'settings.state');
			var state_questions = us_election.required_questions_default;
			if (us_election.state_required_questions[state]) {
				state_questions = state_questions.concat(us_election.state_required_questions[state]);
			}
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
	ovr_disclosure: {
		pre_process: function(action, conversation, user) {
			var state = util.object.get(user, 'settings.state');
			var disclosure = us_election.state_confirmation_disclosures[state].text;
			var full_disclosure = l10n('prompt_ovr_disclosure', conversation.locale)+': "'+disclosure+'"';
			var res = {
				next: 'confirm_ovr_disclosure',
				advance: true,
				delay: default_delay(conversation)
			}

			if (conversation.type != 'fb') {
				res.msg = full_disclosure;
			} else {

				// Facebook messenger doesn't support messages > 320 characters.
				// We need to split this up into chunks and send separate messages
				var chunks = util.splitter(full_disclosure, 318);

				var sendChunk = function(chunk, delay) {
					setTimeout(function() {
						facebook_model.message(user.username, chunk);
					}, delay);
				}

				for (var i=0; i<chunks.length; i++) {
					var chunk = chunks[i];

					if (i != 0)
						chunk = '…' + chunk;

					if (i < chunks.length - 1)
						chunk = chunk + '…';

					sendChunk(chunk, i*config.bot.advance_delay_fb);
				}
				res.delay = (i+1)*config.bot.advance_delay_fb;
			}

			return res;
		}
	},
	confirm_ovr_disclosure: {
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
			return Promise.resolve({next: 'choose_nvra_delivery'});
		}
	},
	submit: {
		process: function(body, user, step, conversation) {
			if (!config.app.submit_ovr_url || !config.app.submit_pdf_url) {
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
			var state_deadline = us_election.get_ovr_deadline(state);
			var failed_ovr = util.object.get(user, 'settings.failed_ovr');
			if (us_election.state_integrated_ovr[state] && !failed_ovr) {
				log.info('bot: sending OVR submission...');
				var url = config.app.submit_ovr_url;
			} else {
				log.info('bot: sending PDF submission...');
				var url = config.app.submit_pdf_url;
			}

			var submission;
			var body = {
					user: user,
					mail_deadline_text: us_election.get_mail_deadline_text(user.settings.state),
					callback_url: config.app.url + '/receipt/'+user.username
				};

			return submission_model.create(user.id, conversation.id, url, body)
				.then(function(_submission) {
					submission = _submission;

					body.uid = submission.form_stuffer_reference;

					// send to votebot-forms
					var form_submit = {
					    method: 'POST',
					    uri: url,
					    body: body,
					    json: true				
					};
					if (config.votebot_api_key) {
						var username = (config.votebot_api_key || '');
						var password = '';
						form_submit.headers = {
						    'Authorization': 'Basic ' + new Buffer(username+':'+password).toString('base64')                  
						  }
					}
					return request(form_submit);
				}).then(function (response) {
			    	log.info('bot: form_submit: response', response);
			    	log.info('bot: saving response uid ', response.uid);

			    	// JL NOTE ~ We are now generating the uuid here in votebot-api
			    	/*
			    	submission_model.update(submission.id, {
			    		form_stuffer_reference: response.uid
			    	});
			    	
					// JL NOTE ~ This should work via the existing promise.
			    	var update_user = util.object.set(user, 'submit', true);
			    	user_model.update(user.id, update_user);
			    	*/

			    	return Promise.resolve({
						next: 'processing',
						store: {
							'user.submit': true
						}
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
	processing: {
		process: function(body, user) {
			return Promise.resolve({next: 'processing'});
		}
	},
	processed: {
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
			var mail_eta = util.object.get(user, 'settings.nvra_mail_eta');
			var pdf_url = util.object.get(user, 'settings.nvra_pdf_url'),
      			requirements = us_election.get_registration_requirements(user.settings.state),
      			deadline = l10n('frag_soon', conversation.locale);

      		if (requirements["Deadlines"]["received-by"]) {
		      deadline = moment(requirements["Deadlines"]["received-by"]).format('MM/DD')
		    } else if (requirements["Deadlines"]["mail-by"]) {
		      deadline = moment(requirements["Deadlines"]["mail-by"]).format('MM/DD')
		    }

			if (form_type != 'NVRA') {
				// registration complete online, no extra instructions
				setTimeout(function() {
					var msg = language.template(l10n('msg_complete_ovr_disclaimer', conversation.locale), user, conversation.locale);
					message_model.create(config.bot.user_id, conversation.id, {body: msg});
				}, config.bot.advance_delay);
				return {
					msg: l10n('msg_complete_ovr', conversation.locale),
					next: 'share',
					delay: config.bot.advance_delay * 4
				};
			} else {
				if (mail_eta) {
					var msg = l10n('msg_complete_mail', conversation.locale),
						friendly_eta = momentTZ(mail_eta).tz('America/Los_Angeles').format('MMMM D'),
						msg = msg.replace('{{mail_eta}}', friendly_eta);
						msg = msg.replace('{{deadline}}', deadline);
					return {
						msg: msg,
						next: 'share',
						delay: config.bot.advance_delay * 4
					};
				} else {
					if (conversation.type == 'fb' && pdf_url) {
						var msg = l10n('msg_complete_pdf_fb', conversation.locale);
						msg = msg.replace('{{deadline}}', deadline);
						msg = language.template(msg, user, conversation.locale);
						facebook_model.message(
							user.username, 
							msg
						);
						facebook_model.file(
							user.username,
							pdf_url
						);
						return {
							next: 'share',
							delay: config.bot.advance_delay * 4
						};
					} else {
						var msg = l10n('msg_complete_pdf', conversation.locale);
						msg = msg.replace('{{deadline}}', deadline);
						return {
							msg: msg,
							next: 'share',
							delay: config.bot.advance_delay * 4
						};
					}
				}
			}
		},
		process: function(body, user) {
			return Promise.resolve({next: 'share'});
		}
	},
	ovr_failed: {
		name: 'ovr_failed',
		msg: '',
		no_msg: true,

		process: function(body, user, step, conversation) {
			var msg = language.template(l10n('msg_ovr_failed', conversation.locale), user, conversation.locale);
			message_model.create(config.bot.user_id, conversation.id, {body: msg});
			return Promise.delay(default_delay(conversation))
				.then(function() {
					return {'next': 'choose_nvra_delivery'}
				});
		},
	},
	choose_nvra_delivery: {
		process: function(body, user) {
			return Promise.resolve({
				advance: !language.is_yes(body) ? true : false,
				next: !language.is_yes(body) ? 'submit' : 'choose_postage',
				store: {
					'user.settings.mail_letter': !language.is_yes(body),
					'user.settings.include_postage': !language.is_yes(body)
				}
			});
		}
	},
	choose_postage: {
		process: function(body) {
			return Promise.resolve({
				next: 'submit',
				advance: true,
				store: {
					'user.settings.include_postage': !!language.is_yes(body)
				}
			});
		}
	},
	incomplete: {
		pre_process: function(action, conversation, user) {
			var failed = util.object.get(user, 'settings.failed_pdf');
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
		pre_process: function(action, conversation, user) {

			var res = {
				'next': 'share_sms',
				'delay': default_delay(conversation)
			};

			// Send a pretty share button if this is a Facebook thread			
			if (conversation.type == 'fb') {
				facebook_model.buttons(
					user.username,
					l10n('msg_share_facebook_messenger', conversation.locale),
					[
						{
							type: 'web_url',
							url: 'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Ffftf.io%2Ff%2F7a1836',
							title: l10n('button_share', conversation.locale)
						}
					]
				);
			} else {
				res.msg = l10n('msg_share', conversation.locale);				
			}
			return res;
		},
		process: function() {
			return Promise.resolve({'next': 'share_sms'})
		},
	},
	share_sms: {
		name: 'share_sms',
		pre_process: function(action, conversation, user) {
			if (conversation.type == 'sms' || conversation.type == 'web')  {
				var res = {
					'next': 'sms_notice',
					'msg': l10n('msg_share_sms', conversation.locale),
					'delay': default_delay(conversation),
				};
			} else {
				var res = {
					'next': 'final_tmp'
				}
			} 
			return res;
		},
		process: function() {
			return Promise.resolve({'next': 'final_tmp'})
		},
	},
	sms_notice: {
		name: 'sms_notice',
		pre_process: function(action, conversation, user) {
			if (conversation.type == 'sms' || conversation.type == 'web')  {
				var locale = conversation.locale;
				if (conversation.partner) {
					tpl = {partner: conversation.partner.toUpperCase()};

					var msg_1 = language.template(l10n('msg_sms_notice_partner', locale), tpl, locale);
					var msg_2 = l10n('msg_sms_fftf_stop', locale);

					// send both our and partner opt-out messages, no delay in between
					message_model.create(config.bot.user_id, conversation.id, {body: msg_1});
					message_model.create(config.bot.user_id, conversation.id, {body: msg_2});
				} else {
					// just send the single FFTF&EF notice
					var msg = l10n('msg_sms_notice', locale);
					message_model.create(config.bot.user_id, conversation.id, {body: msg});
				}
				var res = {
					'next': 'final_tmp', // was fftf_opt_in, disable until list sharing resolved
				};
			} else {
				var res = {
					'next': 'final_tmp' // don't send sms message for other messaging services
				}
			}
			return res;
		},
		process: function() {
			return Promise.resolve({'next': 'final_tmp'})
		},
	},
	// JL NOTE ~ put this in as the final instead of the sharing prompt
	final_tmp: {
		name: 'final_tmp',
		msg: '',
		no_msg: true,
		errormsg: '',
		next: '(final)',
		final: true
	},
	fftf_opt_in: {
		process: simple_store('user.settings.fftf_opt_in', {validate: validate.boolean}),
	},
	restart: {
		process: simple_store('user.settings', {
			validate: validate.empty_object,
			advance: true
		}),
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
		process: simple_store('user.settings.political_party', {validate: validate.political_party})
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
				return {next: 'per_state'};
			} else {
				return {};
			}
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
		process: simple_store('user.settings.ssn_last4', {validate: validate.ssn_last4})
	},
	state_id_or_ssn_last4: {
		pre_process: function(action, conversation, user) {
			if(util.object.get(user, 'settings.state_id_number') || util.object.get(user, 'settings.ssn_last4')) {
				// mark this step done by setting it's name to true
				var update_user = util.object.set(user, 'settings.state_id_or_ssn_last4', true);
				user_model.update(user.id, update_user);
				return {next: 'per_state'};
			}
		},
		process: simple_store('user.settings.ssn_last4', {validate: validate.ssn_last4})
	},
	state_id_or_full_ssn: {
		pre_process: function(action, conversation, user) {
			if(util.object.get(user, 'settings.state_id_number') || util.object.get(user, 'settings.ssn')) {
				var update_user = util.object.set(user, 'settings.state_id_or_full_ssn', true);
				user_model.update(user.id, update_user);
				return {next: 'per_state'};
			}
		},
		process: simple_store('user.settings.ssn', {validate: validate.ssn})
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

	has_previous_address: {
		process: function(body, user) {
			var next = 'per_state';

			if (language.is_yes(body)) {
				var update_user = util.object.set(user, 'settings.has_previous_address', true);
				next = 'previous_address';
			} else {
				var update_user = util.object.set(user, 'settings.has_previous_address', false);
			}

			return user_model.update(user.id, update_user).then(function() {;
				return Promise.resolve({next: next})
			});
		},
	},

	previous_address: {
		process: function(body, user) {
			if (language.is_skip(body)) {
				return Promise.resolve({
					next: 'per_state',
					store: {
						'user.settings.has_previous_address': false
					}
				});
			}
			return street_address_model.validate(body)
				.then(function(address_data) {
					log.info('bot: got previous address from smarty: ', address_data);
					var previous_address = {
						'user.settings.has_previous_address': true,
						'user.settings.previous_address': validate.massage_street_address(address_data, {omit_apartment: true}),
						'user.settings.previous_city': address_data.components.city_name,
						'user.settings.previous_state': address_data.components.state_abbreviation,
						'user.settings.previous_zip': address_data.components.zipcode,
						'user.settings.previous_county': address_data.metadata.county_name,
					}
					if (address_data.components.secondary_number)
						previous_address['user.settings.previous_address_unit'] = address_data.components.secondary_number;

					return {
						next: 'per_state',
						store: previous_address
					};
				})
				.catch(function(baaahhhh) {
					log.info('bot: BOGUS PREVIOUS ADDRESS:', body);
					return {
						next: 'previous_address_street',
						store: {
							'user.settings.has_previous_address': true
						}
					};
				});
		}
	},

	previous_address_street: {
		process: simple_store('user.settings.previous_address'),
	},

	previous_address_unit: {
		process: function(body) {
			var result = {
				next: 'previous_city',
				store: {
					'user.settings.previous_address_unit': body
				}
			};
			if (
				body.toLowerCase().indexOf('none') !== -1
				||
				body.toLowerCase().indexOf('ninguno') !== -1
				)
				result.store['user.settings.previous_address_unit'] = null;

			return Promise.resolve(result);
		}
	},

	previous_city: {
		process: simple_store('user.settings.previous_city'),
	},

	previous_state: {
		process: simple_store('user.settings.previous_state', {validate: validate.us_state}),
	},

	previous_zip: {
		process: simple_store('user.settings.previous_zip'),
	},

	previous_county: {
		process: simple_store('user.settings.previous_county'),
	},

	has_previous_name_address: {
		process: function(body, user) {
			if (language.is_yes(body)) {
				return Promise.resolve({
					next: 'previous_name',
					store: {
						'user.settings.has_previous_name_address': true
					}
				});
			}
			return Promise.resolve({
				next: 'per_state',
				store: {
					'user.settings.has_previous_name_address': false,
					'user.settings.has_previous_name': false,
					'user.settings.has_previous_address': false
				}
			});
			
		}
	},

	has_previous_name: {
		process: function(body, user) {
			var next = 'per_state';

			if (language.is_yes(body)) {
				var update_user = util.object.set(user, 'settings.has_previous_name', true);
				next = 'previous_name';
			} else {
				var update_user = util.object.set(user, 'settings.has_previous_name', false);
			}

			return user_model.update(user.id, update_user).then(function() {;
				return Promise.resolve({next: next})
			});
		},
	},

	previous_name: {
		process: function(body, user) {
			if (language.is_skip(body)) {
				return Promise.resolve({
					next: 'previous_address',
					store: {
						'user.settings.has_previous_name': false
					}
				});
			} else {
				return Promise.resolve({
					next: 'previous_address',
					store: {
						'user.settings.has_previous_name': true,
						'user.settings.previous_name': body.trim()
					}
				});
			}
		},
	},

	has_separate_mailing_address: {
		name: 'has_separate_mailing_address',
		msg: l10n('prompt_has_separate_mailing_address'),
		process: function(body, user) {
			var next = 'per_state';

			if (language.is_yes(body)) {
				var update_user = util.object.set(user, 'settings.has_separate_mailing_address', true);
				next = 'separate_mailing_address';
			} else {
				var update_user = util.object.set(user, 'settings.has_separate_mailing_address', false);
			}

			return user_model.update(user.id, update_user).then(function() {;
				return Promise.resolve({next: next})
			});
		},
	},

	separate_mailing_address: {
		name: 'separate_mailing_address',
		msg: l10n('prompt_separate_mailing_address'),
		process: simple_store('user.settings.separate_mailing_address'),
		next: 'per_state'
	},

	az_pevl: {
		name: 'az_pevl',
		msg: l10n('prompt_az_pevl'),
		process: simple_store('user.settings.az_pevl', {validate: validate.boolean}),
		next: 'per_state'
	},

	change_state: {
		name: 'change_state',
		msg: l10n('change_state'),
		process: simple_store('user.settings.change_state', {validate: validate.us_state}),
		next: 'per_state'
	},

	nudge: {
		name: 'nudge',
		msg: l10n('prompt_nudge'),
		process: function(body, user, step, conversation) {
			var next = '_cancel';
			if (language.is_yes(body)) {
				next = conversation.state.back;
				attrition_model.update(
					conversation.state.attrition_log_id,
					{
						recaptured: true
					}
				);
			}
			return Promise.resolve({next: next});
		},
		next: 'incomplete'
	}


};

function default_delay(conversation) {
	if (conversation.type == 'fb')
		return config.bot.advance_delay_fb;
	else
		return config.bot.advance_delay
}

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

		// JL HACK ~
		if (stepName == 'confirm_ovr_disclosure')
			overridden_default.name = 'ovr_disclosure';

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
		obj[store] = body.trim();
		var promise = Promise.resolve({next: step.next, store: obj});
		if(options.validate)
		{
			promise = options.validate(body, user, conversation.locale)
				.spread(function(body, extra_store) {
					log.info('bot: validated body: ', body, '; extra_store: ', extra_store);
					extra_store || (extra_store = {});
					extra_store[store] = body;
					return {
						next: step.next,
						store: extra_store,
						advance: options.advance ? true : false
					};
				});
		}
		return promise;
	};
}

var cancel_conversation = function(user, conversation) {
	if (user_model.use_notify(user.username)) { notify.delete_binding(user); }

	var stop_msg = l10n('msg_unsubscribed', conversation.locale);
	return message_model.create(config.bot.user_id, conversation.id, {
		body: language.template(stop_msg, null, conversation.locale)
	}).then(function() {
		// mark user inactive, so we don't share their info with partners
		user_model.update(user.id, util.object.set(user, 'active', false));
		convo_model.close(conversation.id);
	});
};

var parse_step = function(step, body, user, conversation)
{
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
				message_model.create(config.bot.user_id, conversation.id, {body: language.template(res.msg, user, conversation.locale)});
			}
			if (res && res.next)
				var processed_next = res.next;
			if (res && res.delay)
				var processed_next_delay = res.delay;
		}

		// same for post_process
		// JL NOTE ~ this code is duplicated and was causing problems.
		/*
		if (nextstep.post_process) {
			var res = nextstep.post_process(user, conversation);
			if (res && res.msg) {
				message_model.create(config.bot.user_id, conversation.id, {body: language.template(res.msg, user, conversation.locale)});
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
				return Promise.delay(processed_next_delay).then(function() {
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
exports.start = function(type, to_user_id, conversation_id, options)
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

			convo_model.update(conversation_id, {
				state: {type: type, step: first_step_name},
			}).then(function(conversation) {
				log.info('bot: about to send first message! conversation:', conversation.id);

				if (conversation.partner && partners[conversation.partner])
				{
					var partner = partners[conversation.partner],
						locale  = conversation.locale;

					if (locale != 'en' && partner['msg_intro_'+locale])
						step.msg = partner['msg_intro_'+locale];
					else if (partner['msg_intro'])
						step.msg = partners[conversation.partner].msg_intro;
				}

				message_model.create(
					config.bot.user_id,
					conversation.id,
					{ body: language.template(step.msg, null, conversation.locale) }
				)
				return conversation;
			}).then(function(conversation) {
				if (step.advance) {
					// advance conversation to next step, without waiting for user
					// delay slightly, to avoid intro messages sending out of order
					Promise.delay(default_delay(conversation)).then(function() {
						return exports.next(user.id, conversation);
					});
				}
			});
			
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

	if (conversation.active == false) {
		// refuse to send anything, even if prompted
		log.info('bot: recv msg, but conversation inactive');
		return;
	}

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

			// handle stop messages first
			if(language.is_cancel(body)) {
				return cancel_conversation(user, conversation);
			}

			// we've reached the final step
			if(step.final)
			{
				log.info('bot: recv msg, but conversation finished');
				if (language.is_yes(body)) {
					log.info('bot: user wants to restart');
					step = _restart;
				} else {
					log.info('bot: prompt to restart');
					var restart_msg = l10n('prompt_restart_after_complete', conversation.locale)
					return message_model.create(config.bot.user_id, conversation.id, {body: language.template(restart_msg, user, conversation.locale)});
				}
			}
			
			return parse_step(step, body, user, conversation)
				.then(function(action) {
					log.info('bot: action:', JSON.stringify(action));

					log_chain_step_exit(step.id);

					if(action.next == '_cancel') {
						return cancel_conversation(user, conversation);
					}

					if(action.next == '_help') {
						var help_msg = l10n('msg_help', conversation.locale);
						message_model.create(config.bot.user_id, conversation.id, {body: language.template(help_msg, null, conversation.locale)});
						// let user continue
						action.next = action.prev; 
					}

					if(action.next == '_back') {

						// JL HACK ~ going "back" will not work due to preprocess
						// just go back to the zip step if there's an issue						
						if (step.name == 'state' || step.name == 'address') {
							log.info('bot: overriding back! going to zip...');
							action.next = 'zip';
						} else {
							log.info('bot: going back to '+state.back);
							action.next = state.back;
						}
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
									message_model.create(config.bot.user_id, conversation.id, {body: language.template(res.msg, user, conversation.locale)});
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
								return message_model.create(config.bot.user_id, conversation.id, {body: language.template(nextstep.msg, user, conversation.locale)});
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
							.delay(default_delay(conversation))
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
						return message_model.create(config.bot.user_id, conversation.id, {body: language.template(message, user, conversation.locale)});
				})
				// error catching errors. ABORT
				.catch(function(err) {
					log.crit('bot: fatal (giving up): ', err.message, {step: step.name, stack: err.stack});
				});
		});
};
