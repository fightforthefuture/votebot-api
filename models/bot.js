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
var notify = require('./notify');
var l10n = require('../lib/l10n');
var partners = require('../config.partners');

// a helper for very simple ask-and-store type questions.
// can perform data validation as well.
exports.simple_store = function(store, options)
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

var default_steps = {};
default_steps['vote_1'] = require('./chains/vote_1');
default_steps['early_voting'] = require('./chains/early_voting');
default_steps['mail_in'] = require('./chains/mail_in');
default_steps['share'] = require('./chains/share');
default_steps['commit_to_vote'] = require('./chains/commit_to_vote');
default_steps['gotv_1'] = require('./chains/gotv_1');
default_steps['gotv_2'] = require('./chains/gotv_2');
default_steps['gotv_3'] = require('./chains/gotv_3');
default_steps['gotv_4'] = require('./chains/gotv_4');
default_steps['i_voted'] = require('./chains/i_voted');

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
			if (typeof default_steps[type][stepName] !== 'undefined')
				return Promise.resolve(default_steps[type][stepName]);
			else
				return Promise.resolve(null);

		step = step[0];
		var overridden_default = {};

		if (typeof default_steps[type][step.name] !== 'undefined')
			overridden_default = default_steps[type][step.name];

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

exports.cancel_conversation = function(user, conversation) {
	var stop_msg = l10n('msg_unsubscribed_default', conversation.locale);
	return message_model.create(config.bot.user_id, conversation.id, {
		body: language.template(stop_msg, null, conversation.locale),
		force_send: true
	}).then(function() {
		// mark user inactive, so we don't share their info with partners
		return convo_model.close(conversation.id);
	}).then(function() {
		return user_model.update(user.id, util.object.set(user, 'active', false));
	}).then(function(_user2) {
		if (user_model.use_notify(_user2.username)) {
			notify.delete_binding(_user2);
		}
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
			if (res && res.switch_chain) {
				return Promise.delay(convo_model.default_delay(conversation))
					.then(function() {
						convo_model.switch_chain(res.switch_chain, user);
						return {switch_chain: true}
					});
			}
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
					Promise.delay(convo_model.default_delay(conversation)).then(function() {
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
		// refuse to send anything but help and stop, until new opt in from web
		if (language.is_help(message.body)) {
			log.info('bot: recv HELP msg, respond even if convo is inactive');
		} else if (language.is_cancel(message.body)) {
			log.info('bot: recv STOP msg, respond even if convo is inactive');
		} else {
			log.info('bot: recv msg, but conversation inactive');
			return;
		}
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
				return get_chain_step('vote_1', 'restart'); // JL HACK ~
			else
				return null;
		})
		.then(function(_restart) {

			var body = message.body;

			// handle stop messages first
			if(language.is_cancel(body)) {
				return exports.cancel_conversation(user, conversation);
			}

			// we've reached the final step
			if(step.final)
			{
				log.info('bot: recv msg, but conversation finished');
				if (language.is_yes(body)) {
					log.info('bot: user wants to restart: ', _restart);
					// step = _restart;									// JL HACK ~
					return convo_model.switch_chain('vote_1', user);	// JL HACK ~
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

					if (action.switch_chain) {
						return convo_model.switch_chain(action.switch_chain, user);
					}

					if(action.next == '_cancel') {
						return exports.cancel_conversation(user, conversation);
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
							if (found.switch_chain) {
								state._switch_chain = true;
								return false;
							}
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
							if (state._switch_chain) {
								log.info('bot: chain switch -- not updating conversation');
							} else {
								return convo_model.update(conversation.id, {state: state});
							}
						});

					if(action.advance) {
						// advance to next step, without waiting for user response
						// delay slightly 
						promise = promise
							.delay(convo_model.default_delay(conversation))
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
