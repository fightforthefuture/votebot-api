var resutil = require('../lib/resutil');
var convo_model = require('../models/conversation');
var model = require('../models/skype');
var log = require('../lib/logger');
var error = require('../lib/error');
var config = require('../config');
var l10n = require('../lib/l10n');
var message_model = require('../models/message');
var users_model = require('../models/user');

exports.hook = function(app)
{
	app.post('/conversations/skype', postback);
	app.get('/skype/refresh_key', refreshApiKey);
};

var refreshApiKey = function(req, res)
{
	model.refreshApiKey();
	resutil.send(res, {
		"kthx": "bai"
	});
}

var postback = function(req, res)
{
	var data = req.body;
	log.info('skype controller received postback: ', data);

	var nope = function() { 
		log.info('skype controller: NOPE');
		return resutil.send(res, { "error": "lol" });
	}

	if (!data.from || !data.from.id || !data.conversation || !data.conversation.id)
		return nope();

	var username 		= 'Skype:'+data.from.id,
		conversationId 	= data.conversation.id;

	switch (data.type) {

		// user followed the app
		case 'activity/contactRelationUpdate':
		case 'contactRelationUpdate':

			switch (data.action) {

				case "add":
					var body = null;
					break;

				case "remove":
					users_model.wipe(username);

				default:
					return nope();
			}
			break;

		// user sent a message
		case 'message/text':
		case 'message':
			if (!data.text)
				return nope();

			var body = data.text;
			break;

		default:
			return nope();
			break;
	}

	var message = {
		From: username,
		Body: body
	}
	log.info('skype controller passing message to message model: ', message);

	message_model.incoming_message(message, {
		force_active: true,
		conversation_settings: {
			skype_conversation_id: conversationId
		}
	})
		.then(function() {
			log.info('skype controller done with one message');
		})
		.catch(function(err) {
			log.error('skype controller: incoming: ', err);
		});

	resutil.send(res, {
		"hooray": true
	});
	
}
