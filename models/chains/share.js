var Promise = require('bluebird');
var log = require('../../lib/logger');
var l10n = require('../../lib/l10n');
var convo_model = require('../conversation');
var shorten = require('../../lib/shortener');
var config = require('../../config');
var message_model = require('../message');

module.exports = {
    intro: {
        process: function() {
            log.info('bot: share: no message is ever sent for this step lol');
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

            // build tracked share URLs for this user
            var share_url = new Buffer('https://www.hello.vote/share/').toString('base64');
            var tweet_url = new Buffer('https://www.hello.vote/tweet/').toString('base64');
            var base_url = config.app.url;

            shorten(base_url+'/share/'+user.id+'/'+share_url)
                .then(function(shortened) {
                    log.info('bot: share: got shortened share url: ', shortened);
                    share_url = shortened;
                    return shorten(base_url+'/share/'+user.id+'/'+tweet_url)
                }).then(function(shortened) {
                    log.info('bot: share: got shortened tweet url: ', shortened);
                    tweet_url = shortened;
                    var msg = l10n('msg_share_gotv', conversation.locale);
                    msg = msg.replace('{share_url}', share_url);
                    msg = msg.replace('{tweet_url}', tweet_url);
                    return message_model.create(config.bot.user_id, conversation.id, {body: msg});
                });

            var res = {
                'next': 'share_sms',
                'delay': convo_model.default_delay(conversation)*3
            };
            return res;
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({'next': 'share_sms'})
        }
    },
    share_sms: {
        name: 'share_sms',
        pre_process: function(action, conversation, user) {
            if (conversation.type == 'sms' || conversation.type == 'web')  {
                var res = {
                    'next': 'final_tmp',
                    'msg': l10n('msg_share_sms_gotv', conversation.locale),
                    'delay': convo_model.default_delay(conversation),
                };
            } else {
                var res = {
                    'next': 'final_tmp'
                }
            } 
            return res;
        },
        process: function() {
            return Promise.resolve({'next': 'final_tmp'})
        },
    },
    final_tmp: {
        name: 'final_tmp',
        msg: '',
        no_msg: true,
        errormsg: '',
        next: '(final)',
        final: true
    },
}