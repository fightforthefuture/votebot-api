var Promise = require('bluebird');
var log = require('../../lib/logger');
var config = require('../../config');
var email = require('../../lib/email');
var language = require('../../lib/language');
var l10n = require('../../lib/l10n');
var validate = require('../../lib/validate');
var util = require('../../lib/util');

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
            return Promise.resolve({
                next: 'email',
            });

            // or branch based on user input?
            if (language.is_yes(body)) {
                return Promise.resolve({
                    next: 'email',
                });
            } else {
                return Promise.resolve({
                    next: 'final',
                    final: true,
                });
            }
        }
    },
    email: {
        pre_process: function(action, conversation, user) {
            if (util.object.get(user, 'settings.email')) {
                return {next: 'calendar_invite'};
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
                var gttp_link = "https://gttp.votinginfoproject.org/#"+
                    encodeURIComponent(user.settings.address+' '+user.settings.city+' '+user.settings.state);
                var polling_place = util.object.get(user, 'results.polling_place');
                if (polling_place && polling_place.address) {
                    var location = polling_place.address.locationName
                        + " " + results.polling_place.address.line1
                        + " " + results.polling_place.address.line2
                        + " " + results.polling_place.address.city
                        + ", " + results.polling_place.address.state
                        + " " + results.polling_place.address.zip;
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

                return email.sendCalendarInvite(user, calendar_attributes);
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
}
