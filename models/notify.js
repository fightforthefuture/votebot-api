var config = require('../config');
var log = require('../lib/logger');
var user_model = require('./user');
var twilio = require('twilio')(config.twilio.account_sid, config.twilio.auth_token);
var service = twilio.notifications.v1.services(config.twilio.notify_service_sid);

// adds a binding for a user, with the given tag
// stores binding SID as a user setting
// returns a promise that fulfills to the binding instance on success; error details on failure
exports.add_binding = function(user, tag) {
	return new Promise(function(fulfill, reject){
		service.bindings.create({
			endpoint: 'votebot',
			identity: user.first_name + ' ' + user.last_name,
			bindingType: 'sms',
			address: user.username,
			tag: [tag]
		}).then(function(response) {
			log.info('notify: created binding for', user.username, 'with tag [', tag, ']');
			if (!user.settings) {
				user.settings = {};
			}
			user.settings.notify_binding_sid = response.sid;
			user_model.update(user.id, user);
			fulfill(response);
		}).catch(function(error) {
			log.error('notify: failed to create binding:', error);
			reject(error);
		});
	});
};
