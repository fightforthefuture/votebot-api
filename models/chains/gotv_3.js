var log = require('../../lib/logger');
var language = require('../../lib/language');
var bot_model = require('../bot');
var util = require('../../lib/util');
var l10n = require('../../lib/l10n');

var validate = require('../../lib/validate');

module.exports = {
    intro: {
        process: function() {
            log.info('bot: gotv 3: intro');
            return Promise.resolve({'next': 'did_you_vote'});
        }
    },
    did_you_vote: {
        process: function(body, user, step, conversation) {
            if (language.is_yes(body.trim())) {
                return Promise.resolve({'switch_chain': 'i_voted'});
            } else {
                return Promise.resolve({'next': 'prompt_for_voted'});
            }
        }
    },
    prompt_for_voted: {
        name: 'prompt_for_voted',
        msg: '',
        no_msg: true,
        pre_process: function(action, conversation, user) {
            return {
                msg: l10n('prompt_for_voted', conversation.locale)
            }
        },
        process: function(body, user, step, conversation) {
            if (
                body.toLowerCase().indexOf('already') > -1
                ||
                body.toLowerCase().indexOf('voted') > -1
                ) {
                return Promise.resolve({switch_chain: 'i_voted'})
            }
            return Promise.resolve({switch_chain: 'share'})
        }
    }
}