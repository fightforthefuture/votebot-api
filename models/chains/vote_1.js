var Promise = require('bluebird');
var config = require('../../config');
var db = require('../../lib/db');
var email = require('../../lib/email');
var convo_model = require('../conversation');
var submission_model = require('../submission');
var message_model = require('../message');
var existing_registration = require('../existing_registration');
var facebook_model = require('../facebook');
var line_model = require('../line');
var user_model = require('../user');
var attrition_model = require('../attrition');
var street_address_model = require('../street_address');
var error = require('../../lib/error');
var util = require('../../lib/util');
var language = require('../../lib/language');
var log = require('../../lib/logger');
var validate = require('../../lib/validate');
var us_election = require('../../lib/us_election');
var us_states = require('../../lib/us_states');
var request = require('request-promise');
var notify = require('../notify');
var moment = require('moment');
var momentTZ = require('moment-timezone');
var l10n = require('../../lib/l10n');
var bot_model = require('../bot');

var simple_store = bot_model.simple_store;

module.exports = {
    intro: {
        process: function() {
            if (is_gotv_time())
                return Promise.resolve({'switch_chain': 'gotv_1'})    

            return Promise.resolve({'next': 'first_name'})
        }
    },
    intro_facebook: {
        process: function() {
            if (is_gotv_time())
                return Promise.resolve({'switch_chain': 'gotv_1'})    

            return Promise.resolve({'next': 'first_name'});
        }
    },

    // JL NOTE ~ how sad. //
    intro_line_api: {
        name: 'intro_line_api',
        msg: l10n('msg_intro'),
        advance: true,
        next: 'intro',
        process: function(body, user, step, conversation) {
            var msg = l10n('msg_intro_line_api');
            message_model.create(config.bot.user_id, conversation.id, {body: msg});

            return Promise.delay(convo_model.default_delay(conversation))
                .then(function() {
                    if (is_gotv_time())
                        return Promise.resolve({'switch_chain': 'gotv_1'})    

                    return Promise.resolve({next: 'first_name'});
                });
        }
    },
    ////

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
            if (body.trim() == 'woltato') { // JL DEBUG ~ //////////////////////
                return Promise.resolve({ switch_chain: 'gotv_1' });
            } //////////////////////////////////////////////////////////////////
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
        // process: simple_store('user.settings.zip', {validate: validate.zip})
        process: function(body, user, step, conversation) {
            return validate.zip(body, user, conversation.locale)
                .spread(function(body, extra_store) {
                    var update_user = user;

                    util.object.set(update_user, 'settings.zip', body.trim());

                    if (extra_store['user.settings.state'])
                        util.object.set(update_user, 'settings.state', extra_store['user.settings.state']);

                    if (extra_store['user.settings.city'])
                        util.object.set(update_user, 'settings.city', extra_store['user.settings.city']);

                    return user_model.update(user.id, update_user)
                        .then(function(_updated) {
                            return maybe_switch_chains(_updated, 'city');
                        });                    
                });
        }
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
                if (end_msg = us_election.states_without_nvra[state.toUpperCase()]) {
                    // these states don't accept our form, mark them complete and kick them to share
                    if (user_model.use_notify(user.username)) { notify.replace_tags(user, ['votebot-started'], ['votebot-completed']); }
                    return {
                        msg: end_msg,
                        next: 'share',
                        delay: config.bot.advance_delay
                    }
                }
                return {next: 'address'};
            }
        },
        process: function(body, user, step, conversation) {
            return validate.us_state(body, user, conversation.locale)
                .spread(function(us_state) {
                    var update_user = util.object.set(user, 'settings.state', us_state);
                    return user_model.update(user.id, update_user)
                        .then(function(_updated) {
                            return maybe_switch_chains(_updated, 'address');
                        });
                })
        },
        post_process: function(user, conversation) {
            // need to also check state eligibility here, in case we didn't short circuit with pre_process
            return this.check_eligibility(user);
        },
    },
    address: {
        pre_process: function(action, conversation, user) {
            if (user_model.use_notify(user.username)) { notify.add_tags(user, [user.settings.state.toUpperCase()]); }
        },
        process: simple_store('user.settings.address', {validate: validate.address}),
        post_process: function(user, conversation) {

            if (util.object.get(user, 'settings.address_appears_bogus')) {
                var err_meta = {
                    address: util.object.get(user, 'settings.address'),
                    zip: util.object.get(user, 'settings.zip'),
                    user_id: user.id.toString()
                }
                log.notice('bot: vote_1: ADDRESS WARNING', err_meta);
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
                log.notice('bot: vote_1: DATE_OF_BIRTH WARNING', err_meta);
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
                var next = 'deadline_check';

                if (registration_status && registration_status[0] === true) {
                    // they are already registered
                    // mark it
                    var update_user = util.object.set(user, 'settings.already_registered', registration_status[0]);
                    util.object.set(update_user, 'complete', true);
                    user_model.update(user.id, update_user);
                    if (user_model.use_notify(user.username)) {
                        notify.replace_tags(user, ['votebot-started'], ['votebot-completed', 'votebot-already-registered']);
                    }
                    // thank them
                    var msg = language.template(l10n('msg_already_registered', conversation.locale), user, conversation.locale);
                    message_model.create(config.bot.user_id, conversation.id, {body: msg});
                    // and prompt to share

                    return Promise.delay(convo_model.default_delay(conversation))
                        .then(function() {
                            var state = user.settings.state,
                            ev_status = us_election.get_early_voting_or_mail_in(state);
                            
                            switch (ev_status) {
                                case 'early-voting':
                                    return { switch_chain: 'early_voting' };
                                    break;
                                case 'vote-by-mail':
                                    return { switch_chain: 'mail_in' };
                                    break;
                                default:
                                    return { switch_chain: 'commit_to_vote' };
                                    break;
                            }
                        });
                } else {
                    // tell them they're not yet registered, to increase urgency
                    var msg = language.template(l10n('msg_not_yet_registered', conversation.locale), user, conversation.locale);
                    message_model.create(config.bot.user_id, conversation.id, {body: msg});
                }
                return Promise.delay(convo_model.default_delay(conversation))
                    .then(function() {
                        return {'next': next}
                    });
            });
        }
    },

    deadline_check: {
        pre_process: function(action, conversation, user) {
            var state = util.object.get(user, 'settings.state'),
                deadlines = us_election.get_ovr_deadline(state),
                today = moment();

            if (deadlines) {

                // if the state supports OVR, do one thing
                if (deadlines['online']) {
                    var ovr_deadline = moment(deadlines['online'], 'YYYY-MM-DD');

                    // if we're past the OVR deadline, kick them out
                    if (today.isAfter(ovr_deadline, 'day')) {

                        var msg = l10n('error_state_deadline_expired', conversation.locale);

                        if (deadlines['in-person'] == config.election.date)
                            msg = l10n('error_deadline_expired_but_in_person_allowed', conversation.locale);

                        return {
                            next: 'share',
                            msg: msg,
                            delay: convo_model.default_delay(conversation)
                        };                  
                    }

                    // If we're not past the OVR deadline, but haven't implemented
                    // OVR for this state, then ask the user to go to the state site
                    if (!us_election.state_integrated_ovr[state]) {
                        return {next: 'refer_external_ovr'};
                    }

                // if state DOES NOT support OVR, we have to do another thing
                } else {
                    var too_late_for_mailer = us_election.is_too_late_for_mailer(state);
                    var too_late_to_mail = us_election.is_too_late_to_mail(state);
                    var deadline_text = us_election.get_mail_deadline_text(state);
                    
                    // if we're between mailing cutoffs, then we're very close
                    // warn the user that the deadline is basically RIGHT NOW!
                    if (too_late_for_mailer && !too_late_to_mail) {
                        var msg = l10n('msg_warning_deadline_very_close', conversation.locale);
                        msg = msg.replace('{{deadline}}', deadline_text);
                        msg = language.template(msg, user, conversation.locale);

                        return {
                            msg: msg,
                            delay: convo_model.default_delay(conversation),
                            next: 'per_state'
                        }
                    }
                }

            }
            
            return {next: 'per_state'};
        },
    },

    refer_external_ovr: {
        pre_process: function(action, conversation, user) {
            var state = util.object.get(user, 'settings.state'),
                requirements = us_election.get_registration_requirements(state),
                url = requirements['RegisterOnline'];

            var update_user = util.object.set(user, 'complete', true);
            util.object.set(update_user, 'referred', true);
            user_model.update(user.id, update_user);
            if (user_model.use_notify(user.username)) {
                notify.replace_tags(user, ['votebot-started'], ['votebot-completed', 'votebot-completed-ovr']);
            }

            email.sendExternalOVRNotification(user);

            return {
                msg: l10n('msg_refer_external_ovr', conversation.locale).replace('{url}', url),
                next: 'final_tmp'
            }
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
                delay: convo_model.default_delay(conversation)
            }

            if (conversation.type != 'fb' && conversation.type != 'line') {
                res.msg = full_disclosure;
            } else {
                // Facebook Messenger and LINE have special character limits
                // We need to split this up into chunks and send separate messages
                if (conversation.type == 'fb') {
                    var maxChars = 318;
                    var specialModel = facebook_model;
                } else {
                    var maxChars = 1000;
                    var specialModel = line_model;
                }

                var chunks = util.splitter(full_disclosure, maxChars);

                var sendChunk = function(chunk, delay) {
                    setTimeout(function() {
                        specialModel.message(user.username, chunk);
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
                log.info('bot: vote_1: no submit_url in config, skipping submit...');
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
                log.info('bot: vote_1: sending OVR submission...');
                var url = config.app.submit_ovr_url;
            } else {
                log.info('bot: vote_1: sending PDF submission...');
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
                    log.info('bot: vote_1: form_submit: response', response);
                    log.info('bot: vote_1: saving response uid ', response.uid);

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
                    log.error('bot: vote_1: form_submit: unable to post ', {step: 'submit', error: error.error});
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
                if (user_model.use_notify(user.username)) { notify.add_tags(user, ['votebot-completed-ovr']); }
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
                    if (user_model.use_notify(user.username)) { notify.add_tags(user, ['votebot-completed-mail']); }
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
                    if (user_model.use_notify(user.username)) { notify.add_tags(user, ['votebot-completed-pdf']); }
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
            var state = util.object.get(user, 'settings.state');
            var too_late_for_mailer = us_election.is_too_late_for_mailer(state);

            if (too_late_for_mailer) {
                var msg = language.template(l10n('msg_ovr_failed_no_fallback', conversation.locale), user, conversation.locale);
                var next = 'refer_external_ovr';
            } else {
                var msg = language.template(l10n('msg_ovr_failed', conversation.locale), user, conversation.locale);
                var next = 'choose_nvra_delivery';
            }
            message_model.create(config.bot.user_id, conversation.id, {body: msg});
            return Promise.delay(convo_model.default_delay(conversation))
                .then(function() {
                    return {'next': next}
                });
        },
    },
    choose_nvra_delivery: {
        pre_process: function(action, conversation, user) {
            var state = util.object.get(user, 'settings.state');
            var too_late_for_mailer = us_election.is_too_late_for_mailer(state);

            if (too_late_for_mailer) {
                var update_user = util.object.set(user, 'settings.mail_letter', false);
                user_model.update(user.id, update_user);

                return {
                    msg: l10n('msg_you_must_mail', conversation.locale),
                    delay: convo_model.default_delay(conversation),
                    next: 'choose_postage'
                }
            }
        },
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
            log.notice('bot: vote_1: incomplete: submission_error ', util.object.get(user, 'settings.submission_error'), {user_id: user.id.toString()});
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
                'delay': convo_model.default_delay(conversation)
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
                var state = util.object.get(user, 'settings.state');

                if (
                    us_election.state_share_urls[state]
                    &&
                    us_election.state_share_urls[state].tweet_url
                    )
                    var tweet_url = us_election.state_share_urls[state].tweet_url;
                else
                    var tweet_url = 'hellovote.org/tweet';

                var msg = l10n('msg_share', conversation.locale);
                msg = msg.replace('{tweet_url}', tweet_url);
                res.msg = msg;              
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
                    'delay': convo_model.default_delay(conversation),
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
                /*
                // send opt-out notice, if required by TCPA
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
                */
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
                    log.info('bot: vote_1: got previous address from smarty: ', address_data);
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
                    log.info('bot: vote_1: BOGUS PREVIOUS ADDRESS:', body);
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

function maybe_switch_chains(user, defaultNext) {
    if (!user || !user.settings || !user.settings.state)
        return { next: defaultNext };

    var state = user.settings.state,
        deadlines = us_election.get_ovr_deadline(state),
        ev_status = us_election.get_early_voting_or_mail_in(state),
        today = moment();

    if (deadlines) {

        if (deadlines['online']) {
            var ovr_deadline = moment(deadlines['online'], 'YYYY-MM-DD');

            if (!today.isAfter(ovr_deadline, 'day')) {

                log.info('bot: vote_1: still time to register online!');

                if (us_election.state_integrated_ovr[state]) {
                    return { next: defaultNext };
                } else {
                    return { next: 'refer_external_ovr' };
                }
            }
        } else {

            var too_late_to_mail = us_election.is_too_late_to_mail(state);

            if (!too_late_to_mail) {
                log.info('bot: vote_1: still time to vote by mail!');

                return { next: defaultNext };
            }
        }
    }

    log.info('bot: vote_1: user.settings: ', user.settings);
    log.info('bot: vote_1: ev_status: ', ev_status);

    switch (ev_status) {
        case 'early-voting':
            return { switch_chain: 'early_voting' };
            break;
        case 'vote-by-mail':
            return { switch_chain: 'mail_in' };
            break;
        /*
        case 'none':
        case 'absentee-in-person':
            return { next: defaultNext };
            break;
        */
        default:
            var cutoff = moment(config.election.date, 'YYYY-MM-DD');

            if (moment().isAfter(cutoff.subtract(7, "days"), 'day'))
                return { switch_chain: 'commit_to_vote' };

            return { next: defaultNext };
            break;
    }
}

function is_gotv_time() {
    var electionDay = moment(config.election.date, 'YYYY-MM-DD');
    return 
        moment().isSame(electionDay.subtract(1, "days"), 'day')
        ||
        moment().isSame(electionDay, 'day');
}