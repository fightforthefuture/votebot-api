var Promise = require('bluebird');
var config = require('../../config');
var email = require('../../lib/email');
var log = require('../../lib/logger');
var language = require('../../lib/language');
var l10n = require('../../lib/l10n');
var util = require('../../lib/util');
var validate = require('../../lib/validate');

var bot_model = require('../bot');
var polling_place_model = require('../polling_place');
var user_model = require('../user');

module.exports = {
    intro: {
        process: function() {
            log.info('bot: commit_to_vote: no message is ever sent for this step lol');
            
            return Promise.resolve({
                'next': 'commit_to_vote_prompt',
                'store': {
                    'user.settings.started_commit_to_vote': true
                }
            })
        }
    },
    commit_to_vote_prompt: {
        pre_process: function(action, conversation, user) {
            return { msg: l10n('prompt_commit_to_vote', conversation.locale) }
        },
        process: function(body, user, step, conversation) {
            if (!util.object.get(user, 'settings.zip')) {
                return Promise.resolve({'next': 'zip'});
            };
            if (!util.object.get(user, 'settings.address')) {
                return Promise.resolve({'next': 'address'});
            };

            if (!util.object.get(user, 'settings.email')) {
                return Promise.resolve({next: 'email'});
            }

            return Promise.resolve({
                next: 'calendar_invite',
            });

            // branch based on user input?
            // if (language.is_yes(body)) {
            //     return Promise.resolve({
            //         next: 'email',
            //     });
            // } else {
            //     return Promise.resolve({
            //         switch_chain: 'voting_info'
            //     });
            // }
        }
    },
    email: {
        pre_process: function(action, conversation, user) {
            if (util.object.get(user, 'settings.email')) {
                return {next: 'calendar_invite', advance: true};
            }
        },
        process: bot_model.simple_store('user.settings.email', {validate: validate.email, advance: true,})
    },
    calendar_invite: {
        process: function(body, user, step, conversation) {
            return polling_place_model.lookup(user.settings.address, user.settings.city, user.settings.state)
            .then(function(polling_place) {
                var update_user = util.object.set(user, 'results.polling_place', polling_place);
                return user_model.update(user.id, update_user);
            }).then(function(user) {
                var gttp_link = "https://gttp.votinginfoproject.org/#";
                if (user.settings.address) {
                    gttp_link += encodeURIComponent(user.settings.address+' '+user.settings.city+' '+user.settings.state);
                }
                var polling_place = util.object.get(user, 'results.polling_place');
                if (polling_place && polling_place.address) {
                    var location = polling_place.address.locationName
                        + " " + polling_place.address.line1
                        + " " + polling_place.address.line2
                        + " " + polling_place.address.city
                        + ", " + polling_place.address.state
                        + " " + polling_place.address.zip;
                };

                var calendar_attributes = {
                    start: config.election.date,
                    end: config.election.date,
                    title: 'Election Day!',
                    description: 'Get ready to vote with HelloVote',
                    location: location || '',
                    url: gttp_link,
                    status: 'confirmed',
                    attendees: [
                        { name: user.last_name ? user.first_name + " " + user.last_name : user.first_name,
                          email: util.object.get(user, 'settings.email')
                        },
                    ],
                };

                return email.sendCalendarInvite(user, calendar_attributes).then(function() {
                    return Promise.resolve({
                        switch_chain: 'share'
                    });
                })
            });
        }
    },
    zip: {
        process: bot_model.simple_store('user.settings.zip', {validate: validate.zip})
    },
    city: {
        pre_process: function(action, conversation, user) {
            if(util.object.get(user, 'settings.city')) return {next: 'state'};
        },
        process: bot_model.simple_store('user.settings.city', {validate: validate.city})
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
        process: bot_model.simple_store('user.settings.state', {validate: validate.state}),
        post_process: function(user, conversation) {
            // need to also check state here, in case we didn't short circuit with pre_process
            return this.check_state(user);
        },
    },
    address: {
        pre_process: function(action, conversation, user) {
            if (user_model.use_notify(user.username)) { notify.add_tags(user, [user.settings.state.toUpperCase()]); }
        },
        process: bot_model.simple_store('user.settings.address', {validate: validate.address, advance: true}),
        post_process: function(user, conversation) {

            if (util.object.get(user, 'settings.address_appears_bogus')) {
                var err_meta = {
                    address: util.object.get(user, 'settings.address'),
                    zip: util.object.get(user, 'settings.zip'),
                    user_id: user.id.toString()
                }
                log.notice('bot: commit_to_vote: ADDRESS WARNING', err_meta);
                return {msg: l10n('msg_address_appears_bogus', conversation.locale)};
            } else {
                return {}
            }
        }
    }
}
