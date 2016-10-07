var resutil = require('../lib/resutil');
var convo_model = require('../models/conversation');
var model = require('../models/line');
var log = require('../lib/logger');
var error = require('../lib/error');
var config = require('../config');
var l10n = require('../lib/l10n');
var message_model = require('../models/message');
var users_model = require('../models/user');

exports.hook = function(app)
{
	app.post('/conversations/line', postback);
};

var postback = function(req, res)
{
	var data = req.body;
	log.info('line controller received postback: ', data);

	var nope = function() { return resutil.send(res, { "error": "lol" }); }

	if (!data.result
		||
		!data.result[0]
		)
		return nope();

	data = data.result[0]; // simplify it

	switch (data.eventType) {

		// user followed the app
		case '138311609100106403':
			if (!data.content || !data.content.params)
				return nope();

			var username = 'LINE:'+data.content.params[0];

			switch (data.content.opType) {

				case 4:
					var body = null;
					break;

				case 8:
					users_model.wipe(username);

				default:
					return nope();
			}
			break;

		// user sent a message
		case '138311609000106303':
			if (!data.from || !data.content || !data.content.text || !data.content.from)
				return nope();

			var username = 'LINE:'+data.content.from;
			var body = data.content.text;

			break;
		default:
			return nope()
			break;
	}

	var message = {
		From: username,
		Body: body
	}
	log.info('line controller passing message to message model: ', message);

	message_model.incoming_message(message, {force_active: true})
		.then(function() {
			resutil.send(res, {
				"hooray": true
			});
		})
		.catch(function(err) {
			log.error('messages: incoming: ', err);
			resutil.error(res, 'Problem receiving message', err);
		});
		

	
}
