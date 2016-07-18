var config = require('../config');
var log = require('../lib/logger');
var twilio = require('twilio')(config.twilio.account_sid, config.twilio.auth_token);
var service = twilio.notifications.v1.services(config.twilio.notify_service_sid);

exports.add_binding = function(user, tag) {
	service.bindings.create({
		endpoint: 'votebot',
		identity: user.first_name + ' ' + user.last_name,
		bindingType: 'sms',
		address: user.username,
		tag: [tag]
	}).then(function(response) {
		log.info('notify: created binding for', user.username, 'with tag [', tag, ']');
	}).catch(function(error) {
		log.error('notify: failed to create binding: ', error);
	});
};
