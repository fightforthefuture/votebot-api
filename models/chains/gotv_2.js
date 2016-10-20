var log = require('../../lib/logger');
var language = require('../../lib/language');
var polling_place_model = require('../polling_place');


module.exports = {
    intro: {
        process: function() {
            log.info('bot: gotv 2: intro');
            return Promise.resolve({'next': 'election_day_hotline'})
        }
    },
    election_day_hotline: {
        pre_process: function(action, conversation, user) {
            log.info('bot: gotv: looking up polling place info');

            return {msg: language.template(msg, user)};
        },
        process: function(body, user, step, conversation) {
            var vote_time = parse_messy_time.parse(body.trim());

            return Promise.resolve({next: 'vote_time_confirm'})
        }
    },
    election_day_polling_place: {
        pre_process: function(action, conversation, user) {
            var msg = "";
            return {msg: msg};
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({next: 'next'})
        }
    },
}