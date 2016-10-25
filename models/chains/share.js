var log = require('../../lib/logger');

module.exports = {
    intro: {
        process: function() {
            log.info('bot: mail_in: no message is ever sent for this step lol');
            return Promise.resolve({
                'next': 'share_prompt',
                'store': {
                    'user.settings.started_share': true
                }
            })
        }
    },
    share_prompt: {
        pre_process: function(action, conversation, user) {
            // return { msg: l10n('prompt_first_name_fb', conversation.locale) }
            return { msg: 'plz share' }
        },
        process: function(body, user, step, conversation) {
            log.info('bot: share: doing something amazing with the result');
            return Promise.resolve({'next': 'share_prompt'})
        }
    }
}