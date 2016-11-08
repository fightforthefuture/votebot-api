var log = require('../../lib/logger');
var language = require('../../lib/language');
var util = require('../../lib/util');
var l10n = require('../../lib/l10n');

module.exports = {
    intro: {
        pre_process: function(action, conversation, user) {
            log.info('bot: gotv 2: intro');
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({
                'next': 'election_day_hotline', advance: true,
                'store': {
                    'user.settings.started_gotv_2': true
                }
            });
        }
    },
    election_day_hotline: {
        process: function(body, user, step, conversation) {
            return Promise.resolve({next: 'polling_place_directions', delay: 5000})
        }
    },
    polling_place_directions: {
        pre_process: function(action, conversation, user) {
            if (!user.results)
                user.results = {}

            polling_address = util.object.get(user, 'results.polling_place.address');

            if (polling_address) {
                msg = l10n('msg_polling_place', conversation.locale);

                if (polling_address.locationName) {
                    msg = msg.replace('{{location}}', polling_address.locationName)
                } else {
                    msg = msg.replace('{{location}}', polling_address.line1)
                }

                msg = msg.replace('{{location_city}}', polling_address.city.trim());

                return {
                    'msg': msg,
                    'next': 'prompt_for_voted'
                };
            } else {
                return {
                    'msg': '[[msg_lookup_polling_place]]',
                    'next': 'prompt_for_voted'
                };
            }
        },
        process: function(body, user, step, conversation) {
            return Promise.resolve({'next': 'prompt_for_voted'})
        }
    },
    prompt_for_voted: {
        name: 'prompt_for_voted',
        msg: '',
        no_msg: true,
        pre_process: function(action, conversation, user) {
            /*
            return {
                msg: l10n('prompt_for_voted', conversation.locale)
            }
            */
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