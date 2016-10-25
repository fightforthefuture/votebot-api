var log = require('../../lib/logger');
var language = require('../../lib/language');
var bot_model = require('../bot');
var util = require('../../lib/util');

var validate = require('../../lib/validate');

module.exports = {
    intro: {
        process: function() {
            log.info('bot: gotv 3: intro');
            return Promise.resolve({'next': 'did_you_vote'});
        }
    },
    did_you_vote: {
        process: bot_model.simple_store('user.settings.did_you_vote', {validate: validate.boolean, advance: true}),
    },
    vote_reschedule: {
        pre_process: function(action, conversation, user) {
            log.info('bot: gotv 2: intro');

            if (!util.object.get(user, 'results.polling_place')) {
                return Promise.resolve({'switch_chain': 'gotv_1'});
            };
        },
        process: function(body, user, step, conversation) {
            // use parse_messy_time to turn human strings into date object
            var parsed_local_time = parse_messy_time(body.trim());
            // unfortunately it doesn't throw error if it can't parse, just returns midnight
            if (!parsed_local_time.getHours() && !parsed_local_time.getMinutes()) {
                return validate.data_error(step.errormsg, {promise: true});
            }

            // get local timezone from user record
            var local_tz_name = util.object.get(user, 'settings.timezone');
            
            // convert user local time to UTC
            var vote_time_local = moment(parsed_local_time, local_tz_name);
            log.info('bot: gotv: user will vote at '+vote_time_local.format('LT L Z'));

            // schedule gotv_3 chain to re-trigger 30 min before vote_time_schedule_utc
            var vote_time_utc = vote_time_local.clone().tz("UTC");
            var vote_time_schedule_utc = vote_time_utc.subtract(30, 'minutes');
            log.info('bot: gotv: scheduled govt_3 for '+vote_time_schedule_utc.format('LT L Z'));

            // store timezone name and UTC times to user
            var update_user = util.object.set(user, 'settings.timezone', local_tz_name);
            update_user = util.object.set(update_user, 'settings.vote_time', vote_time_utc);
            update_user = util.object.set(update_user, 'settings.vote_time_schedule', vote_time_schedule_utc);
            update_user = util.object.set(update_user, 'settings.vote_time_reschedule', true);

            return user_model.update(user.id, update_user).then(function() {
                return Promise.resolve({next: 'i_voted'});
            })
        }
    },
    i_voted: {
        process: bot_model.simple_store('user.settings.ivoted', {validate: validate.always_true})
    },
    share_gotv: {
        process: function(body, user, step, conversation) {
            return Promise.resolve({next: 'final'})
        }
    }
}

