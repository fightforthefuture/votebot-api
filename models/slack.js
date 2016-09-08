var Promise = require('bluebird');
var rp = require('request-promise');
var config = require('../config');

exports.oauth = function(token) {

	var payload = {
		uri: 'https://slack.com/api/oauth.access',
		method: 'POST',
		form: {
			client_id: config.slack.client_id,
			client_secret: config.slack.client_secret,
			code: token
		}
	}	

	return rp(payload)
	    .then(function (body) {
	    	console.log('SLACK AUTH BODY: ', JSON.decode(body));
	        return Promise.resolve(body);
	    })
	    .catch(function (err) {
	    	console.log('SLACK AUTH ERROR: ', err);
	        return Promise.reject(err);
	    });
}

