var log = require('../../lib/logger');
var bot_model = require('../bot');
var user_model = require('../user');
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
            console.log('reporting_wait_time pre_process reporting_start', util.object.get(user, 'results.reporting.start'));
            if (!util.object.get(user, 'results.reporting.start')) {
                return {'next': 'final'};
            };
        },
        process: function(body, user, step, conversation) {
            // TODO, parse duration from free text
            var wait_minutes = body.trim();

            var update_user = util.object.set(user, 'results.reporting.wait_time', wait_minutes);
            return user_model.update(user.id, update_user).then(function() {
                return Promise.resolve({next: 'reporting_problems'});
            });
        }
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
    send_to_electionland: {
        pre_process: function(action, conversation, user) {
            if (!util.object.get(user, 'results.reporting.contact_ok')) {
                return {next: 'final'};
            };
        },
        process: function(body, user, step, conversation) {
            if (util.object.get(user, 'results.reporting.contact_ok') == false) {
                return Promise.resolve({'next': 'final'});
            }

            // send to electionland
            var url = 'https://electionland-reporting.herokuapp.com/api/incoming/hello-vote';
            var post_data = {
                'phone_number': user_model.parse_username(user).username,
                'first_name': user.first_name,
                'polling_location': util.object.get(user, 'results.polling_location.address'),
                'reporting_wait_time': util.object.get(user, 'results.reporting.wait_time'),
                'reporting_story': util.object.get(user, 'results.reporting.story'),
                'reporting_contact_ok': util.object.get(user, 'results.reporting.contact_ok'),
                'received': util.object.get(user, 'results.reporting.received'),
            };
            
            var story_submit = {
                method: 'POST',
                uri: url,
                body: post_data, 
                json: true              
            };
            if (config.electionland_api_key) {
                var username = (config.electionland_api_key || '');
                var password = '';
                form_submit.headers = {
                    'Authorization': 'Basic ' + new Buffer(username+':'+password).toString('base64')                  
                  }
            }
            return request(story_submit);
        }
    },
}