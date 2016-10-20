var log = require('../../lib/logger');
var language = require('../../lib/language');


module.exports = {
    intro: {
        process: function() {
            log.info('bot: gotv 4: intro');
            return Promise.resolve({'next': 'reporting_start'})
        }
    },
    reporting_start: {
        pre_process: function(action, conversation, user) {
            var msg = "";
            return {msg: msg};
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({next: 'next'})
        }
    },
    reporting_wait_time: {
        pre_process: function(action, conversation, user) {
            var msg = "";
            return {msg: msg};
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({next: 'next'})
        }
    },
    reporting_story: {
        pre_process: function(action, conversation, user) {
            var msg = "";
            return {msg: msg};
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({next: 'next'})
        }
    },
    reporting_contact_ok: {
        pre_process: function(action, conversation, user) {
            var msg = "";
            return {msg: msg};
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({next: 'next'})
        }
    },
    send_to_electionland: {
        pre_process: function(action, conversation, user) {
            var msg = "";
            return {msg: msg};
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({next: 'next'})
        }
    },
}