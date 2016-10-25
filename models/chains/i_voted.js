var log = require('../../lib/logger');
var language = require('../../lib/language');

module.exports = {
    intro: {
        process: function() {
            log.info('bot: i_voted: no message is ever sent for this step lol');
            return Promise.resolve({
                'next': 'i_voted_prompt',
                'store': {
                    'user.settings.started_i_voted': true
                }
            })
        }
    },
    i_voted_prompt: {
        pre_process: function(action, conversation, user) {
            return { msg: 'omg you are so cool!!' }
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({
                next: 'i_voted_prompt'
            })
        }
    }
}