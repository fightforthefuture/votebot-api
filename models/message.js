var db = require('../lib/db');
var config = require('../config');
var error = require('../lib/error');
var Promise = require('bluebird');
var log = require('../lib/logger');
var user_model = require('./user');
var convo_model = require('./conversation');
var bot_model = require('./bot');
var twilio = require('twilio')(config.twilio.account_sid, config.twilio.auth_token);
var partners = require('../config.partners');
var facebook_model = require('./facebook');

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
			return exports.broadcast(conversation_id, message);
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
exports.broadcast = function(conversation_id, message)
{
	log.info('broadcast: '+conversation_id+': ', message.body);
	return exports.get_recipients(conversation_id)
		.then(function(users) {
			users = users.filter(function(u) {
				// only send to active users (and not the user that sent the msg
				// originally)
				return (u.id != message.user_id && u.active)
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
				} else {
					log.info('messages: sending twilio message to ', to_user);

					return twilio.messages.createAsync({
						to: to_user,
						from: config.twilio.from_number,
						messaging_service_sid: config.twilio.messaging_sid,
						body: message.body
					}).catch(function(error) {
						log.error('message: failed to send to: '+ to_user, error);
					});
				}
			}));
		});
};

exports.incoming_message = function(data)
{
	var user;
	log.info('msg: incoming: from: '+data.From+' -- '+data.Body);
	return user_model.upsert(user_model.parse_username(data.From))
		.then(function(_user) {
			user = _user;
			if(!user) throw error('couldn\'t create user');
			if(!user.active) throw error('user is inactive');
			return convo_model.get_recent_by_user(user.id);
		})
		.then(function(conversation) {
			if(conversation)
			{
				log.info('msg: incoming: continuing existing conversation');
				return exports.create(user.id, conversation.id, {body: data.Body})
					.tap(function(message) {
						if(conversation.type === 'p2p') {
							// TODO, advance the bot for each user in turn?
						} else {
							return bot_model.next(user.id, conversation, message)
						}
					});
			}
			else
			{
				log.info('msg: incoming: starting new conversation');

				var convPartner = null,
					trimBody = data.Body.trim().toLowerCase();

				for (var partner in partners) {
					if (partners.hasOwnProperty(partner)) {
						if (trimBody == partners[partner].intro_shortcode) {
							log.info('msg: body matches shortcode: ', partner);
							convPartner = partner;
						}
					}
				}
				var locale = 'en';
				if (data.Body.trim().toLowerCase().indexOf('hola') !== -1)
					locale = 'es';

				return convo_model.create(config.bot.user_id, {
					type: user.type,
					partner: convPartner,
					options: {
						locale: locale
					},
					recipients: [{username: user.username}]
				});
			}
		});
};
