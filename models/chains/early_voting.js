var log = require('../../lib/logger');
var l10n = require('../../lib/l10n');
var rp = require('request-promise');
var bot_model = require('../bot');
var user_model = require('../user');
var validate = require('../../lib/validate');
var util = require('../../lib/util');

var simple_store = bot_model.simple_store;

module.exports = {
    intro: {
        process: function() {
            log.info('bot: early_voting: no message is ever sent for this step lol');
            return Promise.resolve({
                'next': 'early_voting_prompt',
                'store': {
                    'user.settings.started_early_voting': true
                }
            })
        }
    },
    early_voting_prompt: {
        pre_process: function(action, conversation, user) {
            if (
                !user.settings.city
                ||
                !user.settings.state
                ||
                !user.settings.address
            ) {
                return {
                    // msg: l10n('msg_lookup_polling_location', conversation.locale),
                    next: 'city'
                }
            }
            return { msg: l10n('prompt_early_voting', conversation.locale) }
        },

        process: function(body, user, step, conversation) {
            log.info('bot: early_voting: doing something amazing with the result');

            if (body.toLowerCase().indexOf('already') > -1) {
                return Promise.resolve({switch_chain: 'i_voted'})
            }

            var city = util.object.get(user, 'settings.city'),
                state = util.object.get(user, 'settings.state'),
                address = util.object.get(user, 'settings.address'),
                zip = util.object.get(user, 'settings.zip'),
                url = 'https://gttp.votinginfoproject.org/',
                encoded = encodeURIComponent('#'+address+', '+city+', '+state+', '+zip),
                url = 'https://go.hello.vote/api/create/?url=' + url + encoded;

            log.info('bot: early_voting: shortening URL: ', url);

            return rp(url)
                .then(function (htmlString) {
                    log.info('bot: early_voting: got shortened URL: ', htmlString);

                    return {
                        next: 'get_to_the_polls',
                        store: {
                            'user.settings.polling_url': htmlString,
                            'user.settings.response_early_voting': body
                        }
                    }
                })
                .catch(function (err) {
                    return Promise.resolve({'next': 'early_voting_prompt'})
                });
        }
    },
    city: {
        pre_process: function(action, conversation, user) {
            if(util.object.get(user, 'settings.city')) return {next: 'state'};
        },
        process: simple_store('user.settings.city', {validate: validate.city})
    },
    state: {
        pre_process: function(action, conversation, user) {
            return this.check_state(user);
        },
        check_state: function(user) {
            var state = util.object.get(user, 'settings.state');
            if (state) {
                return {next: 'address'};
            }
        },
        process: simple_store('user.settings.state', {validate: validate.state}),
    },
    address: {
        pre_process: function(action, conversation, user) {
            if (user_model.use_notify(user.username)) { notify.add_tags(user, [user.settings.state.toUpperCase()]); }
        },
        process: simple_store('user.settings.address', {validate: validate.address}),
        post_process: function(user, conversation) {

            if (util.object.get(user, 'settings.address_appears_bogus')) {
                var err_meta = {
                    address: util.object.get(user, 'settings.address'),
                    zip: util.object.get(user, 'settings.zip'),
                    user_id: user.id.toString()
                }
                log.notice('bot: early_voting: ADDRESS WARNING', err_meta);
                return {msg: l10n('msg_address_appears_bogus', conversation.locale)};
            } else {
                return {}
            }
        }
    },
    get_to_the_polls: {
        pre_process: function(action, conversation, user) {
            var polling_url = util.object.get(user, 'settings.polling_url');
            return {
                msg: l10n('msg_ev_polling_url', conversation.locale).replace('{url}', polling_url),
                switch_chain: 'share'
            }
        },
        process: function(body, user, step, conversation) {
            log.info('bot: early_voting: doing something wonderful');
            return Promise.resolve({next: 'get_to_the_polls'});
        }
    }
}