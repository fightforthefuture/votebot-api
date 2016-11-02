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
        process: bot_model.simple_store('user.results.reporting.start', {validate: validate.boolean_yes}),
    },
    reporting_wait_time: {
        pre_process: function(action, conversation, user) {
            if (!util.object.get(user, 'results.reporting.start')) {
                return {'next': 'final'};
            };
        },
        process: bot_model.simple_store('user.results.reporting.wait_time', {validate: validate.number}),
    },
    reporting_problems: {
        pre_process: function(action, conversation, user) {
            var wait_time = util.object.get(user, 'results.reporting.wait_time');
            // can be zero, so check against undefined
            if (wait_time === undefined || wait_time === null) {
                return {'next': 'final'}
            };
        },
        process: bot_model.simple_store('user.results.reporting.had_problems', {validate: validate.boolean}),
    },
    reporting_story: {
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
                return {next: 'polling_place'};
            } else {
                return {};
            }
        },
        process: bot_model.simple_store('user.settings.phone', {validate: validate.phone})
    },
    polling_place: {
        pre_process: function(action, conversation, user) {
            var polling_place = util.object.get(user, 'results.polling_place');
            if (polling_place) {
                return {next: 'send_to_electionland', advance: true};
            }
        },
        process: bot_model.simple_store('user.results.polling_place', {validate: validate.not_empty, advance: true})
    },
    send_to_electionland: {
        send_data: function(post_data) {
                // send to electionland
                var url = 'https://landslide.election.land/api/incoming/hello-vote';
                if (config.electionland.api_key) {
                    url = url + '?key=' + config.electionland.api_key;
                }
                
                var story_submit = {
                    method: 'POST',
                    uri: url,
                    body: post_data, 
                    json: true              
                };

                log.info('bot: gotv_4: submitting to electionland', post_data);
                
                return request(story_submit);
            },
        process: function(body, user, step, conversation) {
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
            if (polling_place && polling_place.address) {
                // we got it from google civic
                post_data.polling_location = {
                    address: polling_place.address
                };
            } else {
                // stuff into line1, and let smarty streets deal with it
                polling_place = {
                    address: {
                        line1: polling_place || ''
                    }
                };
                var polling_place_store_extra
                post_data.polling_location = polling_place;
            }

            // look up lat/lon
            var that = this;
            return street_address_model.validate(polling_place.address.line1,
                                                 polling_place.address.city || '',
                                                 polling_place.address.state || '',
                                                 polling_place.address.zip || '')
            .then(function(address_data) {
                if (address_data) {
                    post_data.polling_location.lat = address_data.metadata.latitude || '';
                    post_data.polling_location.lon = address_data.metadata.longitude || '';
                    // update post_data with smarty streets address,city,state,zip
                    post_data.polling_location.address.line1 = validate.massage_street_address(address_data, {omit_apartment: true});
                    post_data.polling_location.address.city = address_data.components.city_name;
                    post_data.polling_location.address.state = address_data.components.state_abbreviation;
                    post_data.polling_location.address.zip = address_data.components.zipcode;
                }

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
                    return Promise.resolve({next: 'send_to_electionland', msg: '[[msg_try_again]]'});
                });
            }).catch(function(error) {
                log.error('unable look up polling place address', error);
                return Promise.resolve({next: 'send_to_electionland', msg: '[[error_validate_address_is_bogus]]'});
            });
        }
    },
}