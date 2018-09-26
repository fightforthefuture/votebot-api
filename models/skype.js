var Promise = require('bluebird');
var rp = require('request-promise');
var config = require('../config');
var log = require('../lib/logger');
var db = require('../lib/db');
var convo_model = require('./conversation');
var xmlescape = require('xml-escape');

var sendMessage = function(payload, conv_id) {
	payload.uri = 'https://apis.skype.com/v3/conversations/'+conv_id+'/activities';
	payload.method = 'POST';

	return rp(payload)
	    .then(function (body) {
	        return Promise.resolve(body);
	    })
	    .catch(function (err) {
	        return Promise.reject(err);
	    });
}

exports.message = function(username, text, conversation_id) {
	var conversation;
	return convo_model.get(conversation_id).then(function(_conversation) {
		conversation = _conversation;
		return getApiKey();
	}).then(function(apiKey) {

		var message = {
			headers: {
				'Authorization': 'Bearer '+apiKey
			},
			json: {
				type: "message/text",
				text: xmlescape(text).replace(/\s(hello.vote[\/\w]*)/g, ' <a href="$1">$1</a>')
			},
		}
		log.info('skype: sending message: ', message);
		return sendMessage(message, conversation.settings.skype_conversation_id);
	});
}

var getApiKey = function() {
	return db.one('SELECT val FROM skype_data WHERE name = \'access_token\'')
		.then(function(result) {
			return result.val;
		});
};

exports.refreshApiKey = function() {
	// db.upsert('users', userdata, 'username')
	log.info('skype: refreshing api key...');
	rp({
		method: 'POST',
		uri: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
		form: {
			client_id: config.skype.api_key,
			client_secret: config.skype.api_secret,
			grant_type: 'client_credentials',
			scope: 'https://graph.microsoft.com/.default'
		}
	})
    .then(function (parsedBody) {
        // POST succeeded... 
        var body = JSON.parse(parsedBody);
        db.upsert(
        	'skype_data',
        	{ name: 'access_token', val: body.access_token },
        	'name'
        );
    })
    .catch(function (err) {
        log.error('FAILED TO REFRESH SKYPE API KEY OMGOMGOMG', err);
    });

}