var resutil = require('../lib/resutil');
var model = require('../models/conversation');
var message_model = require('../models/message');
var log = require('../lib/logger');
var error = require('../lib/error');

exports.hook = function(app)
{
	app.post('/conversations', create);
	app.post('/conversations/:id/messages', new_message);
	app.post('/conversations/incoming', incoming);
	app.get('/conversations/:id/new', poll);
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
	message_model.incoming_sms(data)
		.then(function() {
			resutil.send(res, {thanks: true});
		})
		.catch(function(err) {
			// always ack nicely
			resutil.send(res, {thanks: true});
			log.error('messages: incoming: ', err);
			//resutil.error(res, 'Problem receiving SMS', err);
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

