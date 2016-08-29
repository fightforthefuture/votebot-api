var resutil = require('../lib/resutil');
var express = require('express');
var model = require('../models/conversation');
var user_model = require('../models/user');
var bot_model = require('../models/bot');
var message_model = require('../models/message');
var auth = require('../lib/auth');
var log = require('../lib/logger');
var error = require('../lib/error');
var config = require('../config');

exports.hook = function(app)
{
	app.post('/conversations', create);
	app.get('/conversations', fakeCreateEndpointForFacebookArg);
	app.post('/conversations/:id/messages', new_message);
	app.post('/conversations/incoming', incoming);
	app.get('/conversations/:id/new', poll);
	// TODO: move to users controller
	app.delete('/users/:username', auth.basic, wipe);
};

var create = function(req, res)
{
	var user_id = config.bot.user_id;
	var data = req.body;
	console.log('JL DEBUG ~ ', data);
	model.create(user_id, data)
		.then(function(convo) {
			resutil.send(res, convo);
		})
		.catch(function(err) {
            resutil.error(res, 'Problem starting conversation', err);
		});
};

var fakeCreateEndpointForFacebookArg = function(req, res) {
	console.log('Got Facebook postback token: ', req.query);
	if (req.query['hub.verify_token'] === config.facebook.verify_token) {
		res.send(req.query['hub.challenge']);
  	}
	res.send('Error, wrong validation token');
};

var new_message = function(req, res)
{
	var user_details = req.body.user;
	var data = req.body.message;
	var conversation;
	var conversation_id = req.params.id;
	var user_id = null;
	user_model.get_by_username(user_details.username).then(function(user) {
		user_id = user.id;
		return model.get(conversation_id)
	})
	.then(function(_conversation) {
		conversation = _conversation;

		if(!conversation) throw error('Conversation '+conversation_id+' not found', {code: 404});
		
		return message_model.create(user_id, conversation_id, data)
	})
	.then(function(message) {
		bot_model.next(user_id, conversation, message)
		resutil.send(res, message);
	})
	.catch(function(err) {
        resutil.error(res, 'Problem sending message', err);
	});
};

var incoming = function(req, res)
{
	var data = req.body;
	log.info('incoming: ', JSON.stringify(data));
	message_model.incoming_message(data)
		.then(function() {
			// acknowledge response
			// Twilio expects TwiML or plain text
			resutil.send(res, '<?xml version="1.0" encoding="UTF-8" ?><Response></Response>', {content_type: 'application/xml'});
		})
		.catch(function(err) {
			log.error('messages: incoming: ', err);
			resutil.error(res, 'Problem receiving message', err);
		});
};

var poll = function(req, res)
{
	var user_id = config.bot.user_id;
	var conversation_id = req.params.id;
	var last_id = req.query.last_id || 0;
	var username = req.query.username || '';
	model.poll(user_id, conversation_id, last_id, username)
		.then(function(messages) {
			resutil.send(res, messages);
		})
		.catch(function(err) {
			resutil.error(res, 'Problem grabbing messages', err);
		});
};

var wipe = function(req, res)
{
	var username = req.params.username;
	user_model.wipe(username)
		.then(function(messages) {
			resutil.send(res, true);
		})
		.catch(function(err) {
			resutil.error(res, 'Problem wiping that user\'s data', err);
		});
	// TODO, also wipe notify bindings
};

