var Promise = require('bluebird');
var rp = require('request-promise');
var config = require('../config');
var log = require('../lib/logger');

var sendMessage = function(payload) {
	payload.uri = 'https://mobile.reverehq.com/api/v1/messaging/sendContent';
	payload.method = 'POST';
	payload.headers = {
		"Authorization": config.revere.api_key
	}

	return rp(payload)
	    .then(function (body) {
	    	log.info('revere: sendContent response: ', body);
	        return Promise.resolve(body);
	    })
	    .catch(function (err) {
	        return Promise.reject(err);
	    });
}

exports.message = function(username, text) {
	var message = {
		json: {
			msisdns: [username.replace('Revere:', '')],
			message: text,
			endSession: false
		}
	}
	return sendMessage(message);
}