var log = require('../../lib/logger');
var language = require('../../lib/language');
var util = require('../../lib/util');

module.exports = {
    intro: {
        pre_process: function(action, conversation, user) {
            log.info('bot: gotv 2: intro');

            if (!util.object.get(user, 'results.polling_place')) {
                return Promise.resolve({'switch_chain': 'gotv_1'});
            };
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({'next': 'election_day_hotline', advance: true});
        }
    },
    election_day_hotline: {
        process: function(body, user, step, conversation) {
            return Promise.resolve({next: 'polling_place_directions', delay: 5000})
        }
    },
    polling_place_directions: {
        pre_process: function(action, conversation, user) {
            if (user.results && util.object.get(user, 'results.polling_place')) {
                return {'msg': '[[msg_polling_place]]'};
            } else {
                return {'msg': '[[msg_lookup_polling_place]]'};
            }
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({next: 'final'})
        }
    },
}