var resutil = require('../lib/resutil');
var convo_model = require('../models/conversation');
var log = require('../lib/logger');
var error = require('../lib/error');
var config = require('../config');

exports.hook = function(app)
{
	app.post('/facebook/postback', postback);
	app.get('/facebook/postback', fakePostbackEndpoint);
};

var postback = function(req, res)
{
	var user_id = config.bot.user_id;
	var data = req.body;

	console.log('REQ.BODY: ', JSON.stringify(req.body));

	if (
		!data.object
		||
		!data.object == 'page'
		||
		!data.entry
		||
		!data.entry[0]
		||
		!data.entry[0].messaging
		||
		!data.entry[0].messaging[0]
	) {
		log.error('Unknown Facebook Postback: ', JSON.stringify(req.body));
		return resutil.error(res, 'Problem starting conversation', req.body);
	}

	var message = data.entry[0].messaging[0],
	    sender = message.sender.id;

	switch (message.postback.payload) {
		case 'hi':
		case 'start':
			data = {
				type: 'fb',
				recipients: [{username: 'Messenger:'+sender}]
			}
			convo_model.create(user_id, data)
				.then(function(convo) {
					resutil.send(res, convo);
				})
				.catch(function(err) {
		            resutil.error(res, 'Problem starting conversation', err);
				});
			break;
	}
};

var fakePostbackEndpoint = function(req, res) {
	console.log('Got Facebook postback token: ', req.query);
	if (req.query['hub.verify_token'] === config.facebook.verify_token) {
		return res.send(req.query['hub.challenge']);
  	}
	res.send('Error, wrong validation token');
};
