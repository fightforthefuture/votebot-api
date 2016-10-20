var log = require('../../lib/logger');
var language = require('../../lib/language');
var polling_place_model = require('../polling_place');

module.exports = {
    intro: {
        process: function() {
            log.info('bot: gotv 3: intro');
            return Promise.resolve({'next': 'gotv_did_you_vote'})
        }
    },
    gotv_did_you_vote: {
        pre_process: function(action, conversation, user) {
            var msg = "";
            return {msg: msg};
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({next: 'next'})
        }
    },
    gotv_reschedule: {
        pre_process: function(action, conversation, user) {
            var msg = "";
            return {msg: msg};
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({next: 'next'})
        }
    },
    gotv_i_voted: {
        pre_process: function(action, conversation, user) {
            var msg = "";
            return {msg: msg};
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({next: 'next'})
        }
    },
    gotv_share: {
         pre_process: function(action, conversation, user) {
            var msg = "";
            return {msg: msg};
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({next: 'next'})
        }
    }
}