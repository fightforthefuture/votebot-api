var resutil = require('../lib/resutil');
var convo_model = require('../models/conversation');
var log = require('../lib/logger');
var error = require('../lib/error');
var config = require('../config');
var request = require('request');

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
	    sender = message.sender.id,
		data = {
			type: 'fb',
			recipients: [{username: 'Messenger:'+sender}],
			options: {start: 'intro_facebook'}
		};

	switch (message.postback.payload) {

		case 'hi':
			var message = {
				uri: 'https://graph.facebook.com/v2.6/me/messages?access_token='+config.facebook.access_token,
				method: 'POST',
				json: {
					recipient: {
						id: sender
					},
					message: {
						attachment: {
							type: 'template',
							payload: {
								template_type: 'button',
								text: 'Hi, I\'m HelloVote! I can get you registered to vote with just a few messages. If you\'re already registered, I can help your friends!',
								buttons: [
									{
										type: 'postback',
										title: 'Register to vote!',
										payload: 'start'
									},
									{
										type: 'postback',
										title: 'Register my friends!',
										payload: 'register_friends',
									},
									{
										type: 'web_url',
										url: 'https://www.hellovote.org',
										title: 'Learn more...'
									}
								]
							}
						}
					}
				}
			}
			return facebookMessage(res, message);
			break;

		case 'register_friends':
			var message = {
				json: {
					recipient: {
						id: sender
					},
					message: {
						attachment: {
							type: 'template',
							payload: {
								template_type: 'button',
								text: 'OK! I can get your friends registered to vote right from Facebook Messenger. Please click the button below to share me with your friends!',
								buttons: [
									{
										type: 'web_url',
										url: 'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Ffftf.io%2Ff%2Fbad003',
										title: 'Share HelloVote!'
									}
								]
							}
						}
					}
				}
			}
			return facebookMessage(res, message);
			break;

		case 'start':
			return convo_model.create(user_id, data)
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

var facebookMessage = function(res, options) {

	options.uri = 'https://graph.facebook.com/v2.6/me/messages?access_token='+config.facebook.access_token;
	options.method = 'POST';

	request(options, function (error, response, body) {
		if (error) {
			log.error('facebook: postback send error', error);
			return resutil.error(res, 'Facebook postback error', error);
		}
		resutil.send(res, 'yay');
	});
}