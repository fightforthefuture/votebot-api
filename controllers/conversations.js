var resutil = require('../lib/resutil');
var express = require('express');
var model = require('../models/conversation');
var user_model = require('../models/user');
var message_model = require('../models/message');
var auth = require('../lib/auth');
var log = require('../lib/logger');
var error = require('../lib/error');
var config = require('../config');

exports.hook = function(app)
{
	app.post('/conversations', create);
	app.post('/conversations/:id/messages', new_message);
	app.post('/conversations/incoming', incoming);
	app.get('/conversations/:id/new', poll);
	// TODO: move to users controller
	app.delete('/users/:username', auth.basic, wipe);
};

var create = function(req, res)
{
	var user_id = 1;
	var data = req.body;
	model.create(user_id, data)
		.then(function(convo) {
			resutil.send(res, convo);
		})
		.catch(function(err) {
            resutil.error(res, 'Problem starting conversation', err);
		});
};

var new_message = function(req, res)
{
	var user_id = 1;
	var data = req.body;
	var conversation_id = req.params.id;
	model.get(conversation_id)
		.then(function(conversation) {
			if(!conversation) throw error('Conversation '+conversation_id+' not found', {code: 404});
			return message_model.create(user_id, conversation_id, data)
		})
		.then(function(message) {
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
	message_model.incoming_sms(data)
		.then(function() {
			// acknowledge response
			// Twilio expects TwiML or plain text
			resutil.send(res, '<?xml version="1.0" encoding="UTF-8" ?><Response></Response>', {content_type: 'application/xml'});
		})
		.catch(function(err) {
			log.error('messages: incoming: ', err);
			resutil.error(res, 'Problem receiving SMS', err);
		});
};

var poll = function(req, res)
{
	var user_id = 1;
	var conversation_id = req.params.id;
	var last_id = req.query.last_id || 0;
	model.poll(user_id, conversation_id, last_id)
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
};

