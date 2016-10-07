var Promise = require('bluebird');
var rp = require('request-promise');
var config = require('../config');

var sendMessage = function(payload) {
	payload.uri = 'https://api.line.me/v1/events';
	payload.method = 'POST';
	payload.headers = {
		"X-LINE-ChannelToken": config.line.api_key
	}; 

	return rp(payload)
	    .then(function (body) {
	        return Promise.resolve(body);
	    })
	    .catch(function (err) {
	        return Promise.reject(err);
	    });
}

exports.buttons = function(username, text, buttons) {
	var message = {
		json: {
			to: username.replace('Line:', ''),
			messages: [
				{
					"type": "template",
					"altText": text,
					"template": {
						"type": "buttons",
						"text": text,
						"actions": buttons
					}
				}
			]
		}
	}
	return sendMessage(message);
}

exports.message = function(username, text) {
	var message = {
		json: {
			to: [username.replace('LINE:', '')],
			toChannel: 1383378250,
			eventType: "138311608800106203",
			content: {
				contentType: 1,
				toType: 1,
				text: text
			}
		}
	}
	return sendMessage(message);
}