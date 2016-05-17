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
 */
exports.broadcast = function(conversation_id, message)
{
	// TODO: queue me for each recipient
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
				log.info('sending sms to '+ to);
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
	// example data:
	//
	// -- txt msg:
	// incoming{
	// 	"ToCountry": "US",
	// 	"ToState": "NJ",
	// 	"SmsMessageSid": "SMdcbbdeafe24fdf8d5df03c8cff2130be",
	// 	"NumMedia": "0",
	// 	"ToCity": "",
	// 	"FromZip": "55805",
	// 	"SmsSid": "SMdcbbdeafe24fdf8d5df03c8cff2130be",
	// 	"FromState": "MN",
	// 	"SmsStatus": "received",
	// 	"FromCity": "DULUTH",
	// 	"Body": "Hi",
	// 	"FromCountry": "US",
	// 	"To": "+18565551111",
	// 	"ToZip": "",
	// 	"NumSegments": "1",
	// 	"MessageSid": "SMdcbbdeafe24fdf8d5df03c8cff2130be",
	// 	"AccountSid": "AC008362520019324312e64264dcf9f8f6",
	// 	"From": "+12185551234",
	// 	"ApiVersion": "2010-04-01"
	// }
	//
	// -- media msg:
	// incoming{
	// 	"ToCountry": "US",
	// 	"MediaContentType0": "image/jpeg",
	// 	"ToState": "NJ",
	// 	"SmsMessageSid": "MM5129e06796ac063ae721e0fe4cb913c3",
	// 	"NumMedia": "1",
	// 	"ToCity": "",
	// 	"FromZip": "55805",
	// 	"SmsSid": "MM5129e06796ac063ae721e0fe4cb913c3",
	// 	"FromState": "MN",
	// 	"SmsStatus": "received",
	// 	"FromCity": "DULUTH",
	// 	"Body": "Zulu",
	// 	"FromCountry": "US",
	// 	"To": "+18565551111",
	// 	"ToZip": "",
	// 	"NumSegments": "1",
	// 	"MessageSid": "MM5129e06796ac063ae721e0fe4cb913c3",
	// 	"AccountSid": "AC008362520019324312e64264dcf9f8f6",
	// 	"From": "+12185551234",
	// 	"MediaUrl0": "https://api.twilio.com/2010-04-01/Accounts/AC008362520019324312e64264dcf9f8f6/Messages/MM5129e06796ac063ae721e0fe4cb913c3/Media/ME384328ea2eb342f1e066e260d9d4bf62",
	// 	"ApiVersion": "2010-04-01"
	// }
	var user;
	return user_model.upsert({username: user_model.parsenum(data.From)})
		.then(function(_user) {
			user = _user;
			if(!user) throw error('couldn\'t create user');
			if(!user.active) throw error('user is inactive');
			return convo_model.get_recent_by_user(user.id);
		})
		.then(function(conversation) {
			if(!conversation) throw error('user is in no conversations');
			return exports.create(user.id, conversation.id, {body: data.Body})
				.tap(function(message) {
					if(conversation.type == 'bot')
					{
						return bot_model.next(user.id, conversation, message)
					}
				});
		});
};

