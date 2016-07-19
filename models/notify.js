var config = require('../config');
var log = require('../lib/logger');
var user_model = require('./user');
var twilio = require('twilio')(config.twilio.account_sid, config.twilio.auth_token);
var service = twilio.notifications.v1.services(config.twilio.notify_service_sid);

// adds a binding for a user, with the given tag
// stores binding SID as a user setting
// overrites any existing binding for the user
// accepts a user object and a list of tags as strings
// returns a promise that fulfills to the binding SID on success; error details on failure
exports.create_binding = function(user, tags) {
	return new Promise(function(fulfill, reject){
		service.bindings.create({
			endpoint: 'votebot',
			identity: user.first_name + ' ' + user.last_name,
			bindingType: 'sms',
			address: user.username,
			tag: tags
		}).then(function(response) {
			log.info('notify: created binding for', user.username, 'with tags:', JSON.stringify(tags));
			if (!user.settings) {
				user.settings = {};
			}
			user.settings.notify_binding_sid = response.sid;
			user_model.update(user.id, user);
			fulfill(response.sid);
		}).catch(function(error) {
			log.error('notify: failed to create binding:', error);
			reject(error);
		});
	});
};

// adds tags to a user's binding
// updates the binding SID for the user
// accepts a user object and a list of additional tags as strings
// returns a promise that fulfills to the binding SID on success, error details on failure
exports.add_tags = function(user, new_tags) {
	return new Promise(function(fulfill, reject) {
		exports.fetch_binding(user)
		.then(function(binding) {
			all_tags = binding.tags.slice();
			new_tags.map(function(tag) {
				if (binding.tags.indexOf(tag) == -1) {
					all_tags.push(tag);
				}
			});
			exports.create_binding(user, all_tags)
			.then(function(binding_sid) {
				fulfill(binding_sid);
			}).catch(function(error) {
				reject(error);
			});
		}).catch(function(error) {
			reject(error);
		});
	});
}

// fetches a binding associated with a user
// accepts a user object
// returns a promise that fulfills to the user's binding; error details on failure
exports.fetch_binding = function(user) {
	return new Promise(function(fulfill, reject) {
		if (!user.settings.notify_binding_sid) {
			log.error('notify: user does not have a binding:', user.username);
			reject(null);
		}
		service.bindings(user.settings.notify_binding_sid).fetch()
		.then(function(response) {
			fulfill(response)
		}).catch(function(error) {
			log.error('notify: error fetching binding:', error)
			reject(error);
		});
	});
}
