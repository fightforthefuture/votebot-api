var Promise = require('bluebird');
var config = require('../../config');
var email = require('../../lib/email');
var log = require('../../lib/logger');
var language = require('../../lib/language');
var l10n = require('../../lib/l10n');
var validate = require('../../lib/validate');
var util = require('../../lib/util');
var validate = require('../../lib/validate');
var message_model = require('../message');
var convo_model = require('../conversation');
var moment = require('moment-timezone');
var shorten = require('../../lib/shortener');

var bot_model = require('../bot');
var polling_place = require('../../lib/polling_place');
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
            var first_name = util.object.get(user, 'first_name') || 'there';
            if (
                user.notifications
                &&
                user.notifications.sent
                &&
                user.notifications.sent.indexOf('commit_to_vote') > -1)
                var msg = l10n('prompt_commit_to_vote_from_notification', conversation.locale);
            else
                var msg = l10n('prompt_commit_to_vote', conversation.locale);

            msg = msg.replace('{{first_name}}', first_name);
            return { msg: msg }
        },
        process: function(body, user, step, conversation) {
            if (body.toLowerCase().indexOf('already') > -1) {
                return Promise.resolve({switch_chain: 'i_voted'})
            }

            if (language.is_no(body)) {
                return Promise.resolve({switch_chain: 'share'})
            }
            
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
                advance: true
            });
        }
    },
    email: {
        process: bot_model.simple_store('user.settings.email', {validate: validate.email, advance: true,})
    },
    calendar_invite: {
        process: function(body, user, step, conversation) {
            var user;

            return polling_place.lookup(user.settings.address, user.settings.city, user.settings.state)
            .then(function(_polling_place) {
                var update_user = util.object.set(user, 'results.polling_place', _polling_place);
                return user_model.update(user.id, update_user);
            }).then(function(_user) {
                user = _user;
                var gttp_link = "https://gttp.votinginfoproject.org/";
                if (user.settings.address) {
                    gttp_link += encodeURIComponent('#' + user.settings.address+' '+user.settings.city+' '+user.settings.state);
                }
                return shorten(gttp_link);
            }).then(function(gttp_link) {

                var _polling_place = util.object.get(user, 'results.polling_place');
                if (_polling_place && _polling_place.address) {
                    var location = '';

                    if (_polling_place.address.locationName)
                        location += _polling_place.address.locationName.trim() + ',';

                    if (_polling_place.address.line1)
                        location += ' ' + _polling_place.address.line1.trim();

                    if (_polling_place.address.line2)
                        location += ', ' + _polling_place.address.line2.trim();

                    if (_polling_place.address.city)
                        location += ', ' + _polling_place.address.city.trim(); 
                    
                    if (_polling_place.address.state)
                        location += ', ' + _polling_place.address.state.trim();

                    if (_polling_place.address.zip)
                        location += ' ' + _polling_place.address.zip.trim();
                };

                var election_day = moment(config.election.date, 'YYYY-MM-DD');
                var calendar_attributes = {
                    start: election_day.format('YYYY-MM-DD'),
                    end: election_day.add(1, 'day').format('YYYY-MM-DD'),
                    title: 'Election Day!',
                    description: 'Get ready to vote with HelloVote! Find your poll at '+gttp_link,
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
                    var msg = l10n('msg_calendar_invite');
                    message_model.create(config.bot.user_id, conversation.id, {body: msg});

                    return Promise.delay(convo_model.default_delay(conversation))
                        .then(function() {

                            if (!location)
                                return Promise.resolve({
                                    switch_chain: 'share'
                                });

                            var msg = "Your Election Day polling location is: "+location;
                            message_model.create(config.bot.user_id, conversation.id, {body: msg});

                            return Promise.delay(convo_model.default_delay(conversation))
                                .then(function() {

                                    return Promise.resolve({
                                        switch_chain: 'share'
                                    });
                                });
                        });
                })
            });
        }
    },
    final: {
        name: 'final',
        msg: '',
        no_msg: true,
        errormsg: '',
        next: '(final)',
        final: true
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
        process: bot_model.simple_store('user.settings.address', {validate: validate.address}),
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
