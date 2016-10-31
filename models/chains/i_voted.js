var log = require('../../lib/logger');
var language = require('../../lib/language');
var l10n = require('../../lib/l10n');

module.exports = {
    intro: {
        process: function() {
            log.info('bot: i_voted: no message is ever sent for this step lol');
            return Promise.resolve({
                'next': 'i_voted_prompt',
                'store': {
                    'user.settings.started_i_voted': true,
                    'user.voted': true
                }
            })
        }
    },
    i_voted_prompt: {
        pre_process: function(action, conversation, user) {
            return { msg: l10n('msg_i_voted_selfie', conversation.locale) }
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({
                switch_chain: 'share'
            })
        }
    }
}