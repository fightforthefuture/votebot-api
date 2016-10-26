var Promise = require('bluebird');
var log = require('../../lib/logger');
var language = require('../../lib/language');
var config = require('../../config');
var l10n = require('../../lib/l10n');
var message_model = require('../message');
var convo_model = require('../conversation');

module.exports = {
    intro: {
        process: function() {
            log.info('bot: mail_in: no message is ever sent for this step lol');
            return Promise.resolve({
                'next': 'mail_in_prompt',
                'store': {
                    'user.settings.started_mail_in': true
                }
            })
        }
    },
    mail_in_prompt: {
        pre_process: function(action, conversation, user) {
            return { msg: l10n('prompt_mail_in', conversation.locale) }
        },
        process: function(body, user, step, conversation) {
            if (language.is_yes(body)) {
                return Promise.resolve({
                    switch_chain: 'i_voted'
                })
            } else {
                var msg = l10n('msg_mail_your_ballot', conversation.locale);
                message_model.create(config.bot.user_id, conversation.id, {body: msg});

                return Promise.delay(convo_model.default_delay(conversation))
                    .then(function() {
                        return Promise.resolve({
                            switch_chain: 'share'
                        })
                    });
            }
        }
    }
}