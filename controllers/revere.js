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
		query = req.query,
		message = {
			From: 'Revere:'+data.msisdn,
			Body: data.mobileText
		},
		options = {
			partner: req.query.client.toLowerCase()
		};

	log.info('revere: incoming: ', data, query);

	message_model.incoming_message(message, options)
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
