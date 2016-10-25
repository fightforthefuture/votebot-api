var Promise = require('bluebird');
var log = require('../../lib/logger');
var config = require('../../config');
var bot_model = require('../bot');
var user_model = require('../user');
var street_address_model = require('../street_address');
var language = require('../../lib/language');
var validate = require('../../lib/validate');
var util = require('../../lib/util');

var moment = require('moment');
var request = require('request-promise');

module.exports = {
    intro: {
        process: function() {
            log.info('bot: gotv 4: intro');
            return Promise.resolve({'next': 'reporting_start'})
        }
    },
    reporting_start: {
        process: bot_model.simple_store('user.results.reporting.start', {validate: validate.boolean}),
    },
    reporting_wait_time: {
        pre_process: function(action, conversation, user) {
            if (!util.object.get(user, 'results.reporting.start')) {
                return {'next': 'final'};
            };
        },
        process: bot_model.simple_store('user.results.reporting.start', {validate: validate.number}),
    },
    reporting_problems: {
        pre_process: function(action, conversation, user) {
            if (!util.object.get(user, 'results.reporting.wait_time')) {
                return {'next': 'final'}
            };
        },
        process: bot_model.simple_store('user.results.reporting.had_problems', {validate: validate.boolean}),
    },
    reporting_story: {
        pre_process: function(action, conversation, user) {
            if (!util.object.get(user, 'results.reporting.had_problems')) {
                return {'next': 'final'}
            };
        },
        process: bot_model.simple_store('user.results.reporting.story', {validate: validate.not_empty}),
        post_process: function(user, conversation) {
            var update_user = util.object.set(user, 'results.reporting.received', moment().utc().format());
            return user_model.update(user.id, update_user);
        },
    },
    reporting_contact_ok: {
        process: bot_model.simple_store('user.results.reporting.contact_ok', {validate: validate.boolean}),
    },
    phone: {
        pre_process: function(action, conversation, user) {
            // save phone from SMS
            var username = user_model.parse_username(user.username);
            if (username.type === 'sms') {
                var update_user = util.object.set(user, 'settings.phone', username.username);
                user_model.update(user.id, update_user);
                return {next: 'send_to_electionland', advance: true};
            } else {
                return {};
            }
        },
        process: bot_model.simple_store('user.settings.phone', {validate: validate.phone, advance: true})
    },
    send_to_electionland: {
        send_data: function(post_data) {
                // send to electionland
                var url = 'https://reporting.election.land/api/incoming/hello-vote';
                if (config.electionland.api_key) {
                    url = url + '?key=' + config.electionland.api_key;
                }
                
                var story_submit = {
                    method: 'POST',
                    uri: url,
                    body: post_data, 
                    json: true              
                };
                
                return request(story_submit);
            },
        process: function(body, user, step, conversation) {
            if (util.object.get(user, 'results.reporting.contact_ok') == false) {
                return Promise.resolve({'next': 'final'});
            }

            var post_data = {
                    'first_name': user.first_name,
                    'phone_number': util.object.get(user, 'settings.phone'),
                    'reporting_wait_time': util.object.get(user, 'results.reporting.wait_time'),
                    'reporting_story': util.object.get(user, 'results.reporting.story'),
                    'reporting_contact_ok': util.object.get(user, 'results.reporting.contact_ok'),
                    'received': util.object.get(user, 'results.reporting.received'),
                };

    
            // send polling location data (if we have it)
            var polling_place = util.object.get(user, 'results.polling_place');
            if (!polling_place) {
                return this.send_data(post_data);
            } else {
               post_data.polling_location = {
                    'address': polling_place.address
                };
            }

            // look up lat/lon
            var that = this;
            return street_address_model.validate(polling_place.address.line1,
                                                 polling_place.address.city,
                                                 polling_place.address.state,
                                                 polling_place.address.zip)
            .then(function(address_data) {
                post_data.polling_location.lat = address_data.metadata.latitude;
                post_data.polling_location.lon = address_data.metadata.longitude;

                return that.send_data(post_data)
                .then(function(response) {
                    log.info('electionland response', response);
                    var update_user = util.object.set(user, 'results.reporting.saved', response.saved);
                    return user_model.update(user.id, update_user).then(function() {
                        return Promise.resolve({next: 'final', msg: '[[msg_reporting_followup]]'});
                    });
                })
                .catch(function(error) {
                    log.error('unable send story to electionland', error);
                });
            }).catch(function(error) {
                log.error('unable look up polling place address', error);
            });
        }
    },
}