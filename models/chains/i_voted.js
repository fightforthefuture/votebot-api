var log = require('../../lib/logger');
var language = require('../../lib/language');
var l10n = require('../../lib/l10n');
var us_election = require('../../lib/us_election');

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
            var result = {msg: l10n('msg_i_voted_selfie', conversation.locale)}
            if (true || us_election.is_election_day()) {
                result['next'] = 'prompt_reporting'
                result['delay'] = 3000;
            }
            return result
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({
                switch_chain: 'share'
            })
        }
    },
    prompt_reporting: {
        name: 'prompt_reporting',
        msg: '',
        no_msg: true,
        pre_process: function(action, conversation, user) {
            var result = {msg: l10n('prompt_election_day_reporting', conversation.locale)}
            return result
        },
        process: function(body, user, step, conversation) {
            if (language.is_yes(body.trim()))
                return Promise.resolve({switch_chain: 'gotv_4'})

            return Promise.resolve({switch_chain: 'share'})
        }
    }
}