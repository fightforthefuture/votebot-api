var Promise = require('bluebird');
var rp = require('request-promise');
var config = require('../config');

var sendMessage = function(payload) {
	payload.uri = 'https://graph.facebook.com/v2.6/me/messages?access_token='+config.facebook.access_token;
	payload.method = 'POST';

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
			recipient: {
				id: username.replace('Messenger:', '')
			},
			message: {
				attachment: {
					type: 'template',
					payload: {
						template_type: 'button',
						text: text,
						buttons: buttons
					}
				}
			}
		}
	}
	return sendMessage(message);
}

exports.message = function(username, text) {
	var message = {
		json: {
			recipient: { id: username.replace('Messenger:', '')	},
			message: { text: text }
		}
	}
	return sendMessage(message);
}