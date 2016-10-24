var Promise = require('bluebird');
var ProgressBar = require('progress');
var config = require('../config');
var log = require('../lib/logger');
var db = require('../lib/db');
var util = require('../lib/util');
var language = require('../lib/language');
var user_model = require('../models/user');
var conversation_model = require('../models/conversation');
var msgs_model = require('../models/message');
var notify = require('../models/notify');

var USERS_TO_SYNC = [
    'SELECT id',
    'FROM   users',
    'WHERE '
];

var bar = new ProgressBar('[:bar] :current / :total :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: 0, // update this below
        });

db.query(
    USERS_TO_SYNC.join('\n'))
    .then(function(users) {
        console.log();
        bar.total = users.length;
        return Promise.map(users, sync_notify_bindings, {concurrency: 10});
    }).then(function() {
        console.log('done, waiting for threads');
    }).catch(function(err) {
        console.error(err);
    });

var sync_notify_bindings = function(user, index, length) {
    // assumes blank slate, adds notify bindings for user states

    return user_model.get(user.id).then(function(user) {
        bar.tick();

        if (!user_model.use_notify(user.username)) {
            log.error('- unable to sync bindings for ', user.username);
            return;
        }

        if(user.active) {
            var tags = [];

            var state = util.object.get(user, 'settings.state');
            if (state) {
                tags.push(state.toUpperCase());
            }

            if (user.complete) {
                // update completion tag with specific method
                // use same if-then structure as bot
                var already_registered = util.object.get(user, 'settings.already_registered');
                if (already_registered) {
                    tags.push('votebot-already-registered');
                } else {
                    var form_type = util.object.get(user, 'settings.submit_form_type');
                    var mail_eta = util.object.get(user, 'settings.nvra_mail_eta');
                    if (form_type == 'NVRA') {
                        if (mail_eta) {
                            tags.push('votebot-completed-mail');
                        } else {
                            tags.push('votebot-completed-pdf');
                        }
                    } else if (form_type) {
                        tags.push('votebot-completed-ovr');
                    }
                }
            } else {
                tags.push('votebot-started');
            }

            log.info('- syncing notify binding', user.username, tags);

            return notify.add_tags(user, tags_add).then(function(sid) {
                var update_user = util.object.set(user, 'settings.notify_synced', true);
                return user_model.update(user.id, update_user);
            });
        } else {
            // inactive user, do not notify
            // clear existing bindings
            var update_user = util.object.set(user, 'settings.notify_binding_sid', null);
            return user_model.update(user.id, update_user);
        }
    });
};
