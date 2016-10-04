var resutil = require('../lib/resutil');
var convo_model = require('../models/conversation');
var model = require('../models/slack');
var log = require('../lib/logger');
var error = require('../lib/error');
var config = require('../config');
var l10n = require('../lib/l10n');
var message_model = require('../models/message');

exports.hook = function(app)
{
	app.post('/conversations/revolution', postback);
};

var postback = function(req, res)
{
	var data = req.body,
		message = {
			From: 'Revere:'+data.msisdn,
			Body: data.mobileText
		};

	log.info('revere: incoming: ', data);

	message_model.incoming_message(message)
		.then(function() {
			resutil.send(res, {
				"endSession": false
			});
		})
		.catch(function(err) {
			log.error('messages: incoming: ', err);
			resutil.error(res, 'Problem receiving message', err);
		});

	
}
