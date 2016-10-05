var Promise = require('bluebird');
var rp = require('request-promise');
var config = require('../config');
var partners = require('../config.partners');
var log = require('../lib/logger');
var convo_model = require('./conversation');

var sendMessage = function(payload, mobileFlow) {
	payload.uri = 'https://mobile.reverehq.com/api/v1/messaging/sendContent';
	payload.method = 'POST';

	return rp(payload)
	    .then(function (body) {
	    	log.info('revere: sendContent response: ', body);

	    	log.info('revere: calling sendContent again to refresh mobileFlow');
	    	payload.json = {
	    		msisdns: payload.json.msisdns,
	    		mobileFlow: mobileFlow
	    	}
	    	rp(payload);

	        return Promise.resolve(body);
	    })
	    .catch(function (err) {
	        return Promise.reject(err);
	    });
}

exports.message = function(username, text, conversation_id) {
	return convo_model.get(conversation_id).then(function(conversation) {
		var partner = partners[conversation.partner];
		log.info('revere: message found partner: ', partner);

		var payload = {
			json: {
				msisdns: [username.replace('Revere:', '')],
				message: text,
				endSession: false
			},
			headers:{
				"Authorization": process.env['REVERE_API_KEY_'+conversation.partner.toUpperCase()]
			}
		}
		return sendMessage(payload, partner.revere_mobile_flow);
	});
}