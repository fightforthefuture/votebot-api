var log = require('../../lib/logger');
var language = require('../../lib/language');
var util = require('../../lib/util');

module.exports = {
    intro: {
        process: function(body, user, step, conversation) {
            log.info('bot: gotv 2: intro');

            if (!util.object.get(user, 'results.polling_place')) {
                return Promise.resolve({'switch_chain': 'gotv_1'});
            };

            return Promise.resolve({'next': 'election_day_hotline'});
        }
    },
    election_day_hotline: {
        process: function(body, user, step, conversation) {
            return Promise.resolve({next: 'election_day_directions', delay: 10*1000})
        }
    },
    election_day_directions: {
        process: function(body, user, step, conversation) {
            return Promise.resolve({next: 'final'})
        }
    },
}