var db = require('../lib/db');
var config = require('../config');
var error = require('../lib/error');
var Promise = require('bluebird');
var log = require('../lib/logger');
var user_model = require('./user');
var convo_model = require('./conversation');
var bot_model = require('./bot');
var twilio = require('twilio')(config.twilio.account_sid, config.twilio.auth_token);

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
 * given a conversation id and a message, blast an SMS to every person in the
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
				var to = config.sms_override || user.username;
				log.info('sending sms to '+to);
				return twilio.messages.createAsync({
					to: to,
					from: config.twilio.from_number,
					body: message.body
				});
			}));
		});
};

exports.incoming_sms = function(data)
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
				log.info('msg: incoming: continuing existing voter reg');
				return exports.create(user.id, conversation.id, {body: data.Body})
					.tap(function(message) {
						if(conversation.type == 'bot')
						{
							return bot_model.next(user.id, conversation, message)
						}
					});
			}
			else
			{
				log.info('msg: incoming: starting new voter reg');
				return bot_model.start('vote_1', user.id, {start: 'intro_direct'});
			}
		});
};

