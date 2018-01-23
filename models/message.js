var db = require('../lib/db');
var config = require('../config');
var error = require('../lib/error');
var Promise = require('bluebird');
var log = require('../lib/logger');
var user_model = require('./user');
var l10n = require('../lib/l10n');
var language = require('../lib/language');
var convo_model = require('./conversation');
var bot_model = require('./bot');
var twilio = require('twilio')(config.twilio.account_sid, config.twilio.auth_token);
var partners = require('../config.partners');
var facebook_model = require('./facebook');
var line_model = require('./line');
var skype_model = require('./skype');

Promise.promisifyAll(twilio.messages);

exports.create = function(user_id, conversation_id, data)
{
	var new_message = {
		user_id: user_id,
		conversation_id: conversation_id,
		body: data.body,
		created: db.now()
	};
	return db.create('messages', new_message)
		.tap(function(message) {
			return exports.broadcast(conversation_id, message, data.force_send || false);
		});
};

exports.get_by_conversation = function(conversation_id)
{
	var vars = {conversation_id: conversation_id};
	return db.query('SELECT * FROM messages WHERE conversation_id = {{conversation_id}}', vars);
};

/**
 * get all recipients (users) of a conversation
 */
exports.get_recipients = function(conversation_id)
{
	var qry = [
		'SELECT',
		'	u.*',
		'FROM',
		'	users u,',
		'	conversations_recipients cr',
		'WHERE',
		'	cr.conversation_id = {{conv_id}} AND',
		'	cr.user_id = u.id'
	];
	return db.query(qry.join('\n'), {conv_id: conversation_id});
};

/**
 * given a conversation id and a message, blast to every person in the
 * conversation (who isn't the message creator)
 *
 * TODO: queue me for each recipient
 */
exports.broadcast = function(conversation_id, message, force_send)
{
	log.info('broadcast: '+conversation_id+': ', message.body);
	return exports.get_recipients(conversation_id)
		.then(function(users) {
			users = users.filter(function(u) {
				// only send to active users (and not the user that sent the msg originally)
				// unless it was a STOP or HELP message, and force_send is true
				return ((u.id != message.user_id) && (u.active || force_send))
			});

			log.info('messages: broadcast to: ', JSON.stringify(users.map(function(u) { return u.id; })));
			return Promise.all(users.map(function(user) {
				var to_user = config.sms_override || user.username;

				if (user.type == 'web') {
					log.info('user ' + user.id + ' is web-only. skip twilio');
					return false;
				} else if (user.type == 'fb') {
					log.info('messages: sending Facebook Message to ', to_user);
					return facebook_model.message(to_user, message.body)
						.catch(function(error) {
							log.error('message: failed to send to: '+ to_user, error);
						});
				} else if (user.type == 'line') {
					log.info('messages: sending Line Message to ', to_user);
					return line_model.message(to_user, message.body)
						.catch(function(error) {
							log.error('message: failed to send to: '+ to_user, error);
						});
				} else if (user.type == 'skype') {
					log.info('messages: sending Skype Message to ', to_user);
					return skype_model.message(to_user, message.body, conversation_id)
						.catch(function(error) {
							log.error('message: failed to send to: '+ to_user, error);
						});
				} else {
					log.info('messages: sending twilio message to ', to_user);

					var twilioMessage = {
						to: to_user,
						body: message.body
					};
					if (config.twilio.messaging_sid) {
						// if using a messaging service, twilio picks the from_number
						twilioMessage.messagingServiceSid = config.twilio.messaging_sid;
					} else if(config.twilio.from_number) {
						twilioMessage.from = config.twilio.from_number;
					} else {
						log.error('message: specify either messaging_sid or from_number in config.twilio');
					}

					return twilio.messages.createAsync(twilioMessage).catch(function(error) {
						log.error('message: failed to send to: '+ to_user, error);
					});
				}
			}));
		});
};

exports.incoming_message = function(data, options)
{
	var user;
	options || (options = {});

	log.info('msg: incoming: from: '+data.From+' -- '+data.Body);
	return user_model.upsert(user_model.parse_username(data.From))
		.then(function(_user) {
			user = _user;
			if(!user) throw error('couldn\'t create user');
			return convo_model.get_recent_by_user(user.id);
		})
		.then(function(conversation) {
			// we must ALWAYS handle STOP/HELP messages over SMS in english, regardless of user activity or locale
			if (data.Body && data.Body.toUpperCase().trim() === "STOP") { 
				log.info('incoming_message: recv STOP msg, send reply and cancel conversation');
				return bot_model.cancel_conversation(user, conversation);
			}
			if (data.Body && data.Body.toUpperCase().trim() === "HELP" && !user.active) {
				log.info('incoming_message: recv HELP msg, send carrier-approved reply');
				var help_msg = l10n('msg_help_default', 'en');
				return exports.create(config.bot.user_id, conversation.id, {body: language.template(help_msg, null, 'en'), force_send: true});
			}

			if(!user.active && !options.force_active) throw error('user is inactive', {code: 403});

			if (config.app.disabled)
				return exports.create(
							config.bot.user_id,
							conversation.id,
							{ body: l10n('msg_disabled', conversation.locale) }
						)

			if(conversation && user.active)
			{
				log.info('msg: incoming: continuing existing conversation');
				if (data.Body)
					return exports.create(user.id, conversation.id, {body: data.Body})
						.tap(function(message) {
							return bot_model.next(user.id, conversation, message)
						});
				else
					return true;
			}
			else
			{
				log.info('msg: incoming: starting new conversation');

				var convPartner = null,
					trimBody = data.Body ? data.Body.trim().toLowerCase() : '';

				if (options.partner) {
					convPartner = options.partner
				} else {
					for (var partner in partners) {
						if (partners.hasOwnProperty(partner)) {
							if (trimBody == partners[partner].intro_shortcode) {
								log.info('msg: body matches shortcode: ', partner);
								convPartner = partner;
							}
						}
					}
				}

				var locale = 'en';
				if (trimBody.indexOf('hola') !== -1)
					locale = 'es';

				return convo_model.create(config.bot.user_id, {
					type: user.type,
					partner: convPartner,
					options: {
						locale: locale,
						force_active: options.force_active ? true : false,
						start: options.start ? options.start : null,
						settings: options.conversation_settings ? options.conversation_settings : null
					},
					recipients: [{username: user.username}]
				});
			}
		});
};
