var resutil = require('../lib/resutil');
var convo_model = require('../models/conversation');
var model = require('../models/slack');
var log = require('../lib/logger');
var error = require('../lib/error');
var config = require('../config');
var l10n = require('../lib/l10n');

exports.hook = function(app)
{
	app.post('/slack/postback', postback);
	app.get('/slack/auth', oauth);
};

var oauth = function(req, res)
{
	console.log('SLACK OAUTH!');
	console.log('req.query: ', req.query);
	console.log('req.body: ', req.body);
	model.oauth(req.query.code);
	// resutil.redirect(res, 'https://www.hello.vote/slack');
};

var postback = function(req, res)
{
	var user_id = config.bot.user_id;
	var data = req.body;


	if (data.token && data.challenge && data.type && data.type == 'url_verification') {
		console.log('Got Slack Challenge: ', data);
		if (data.token === config.slack.verify_token) {
			return res.send({challenge: data.challenge});
	  	}
		return res.send('Error, wrong validation token');
	}


	console.log('REQ.BODY: ', req.body);

	return res.send('ok');

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
	    username = 'Messenger:'+sender,
		data = {
			type: 'fb',
			recipients: [{username: username}],
			options: {start: 'intro_facebook'}
		};

	switch (message.postback.payload) {

		case 'hi':
			model.buttons(
				username, 
				l10n('msg_intro_facebook_get_started'),
				[
					{
						type: 'postback',
						title: l10n('button_register_to_vote'),
						payload: 'start'
					},
					{
						type: 'postback',
						title: l10n('button_register_my_friends'),
						payload: 'register_friends',
					},
					{
						type: 'web_url',
						url: 'https://www.hello.vote',
						title: l10n('button_learn_more')
					}
				]
			);
			return resutil.send(res, 'yay');
			break;

		case 'register_friends':
			model.buttons(
				username,
				l10n('prompt_facebook_get_started_share'),
				[
					{
						type: 'web_url',
						url: 'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Ffftf.io%2Ff%2F7a1836',
						title: l10n('button_share')
					}
				]
			);
			return resutil.send(res, 'yay');
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
		
	});
}