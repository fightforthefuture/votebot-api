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

var USERS_TO_BE_FIXED = [
    'SELECT id',
    'FROM   users',
    'WHERE  complete = true',
    "AND    settings->>'fixed_notify' is null",
];

var bar = new ProgressBar('[:bar] :current / :total :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: 0, // update this below
        });

db.query(
    USERS_TO_BE_FIXED.join('\n'))
    .then(function(users) {
        console.log();
        bar.total = users.length;
        return Promise.map(users, fix_notify_bindings, {concurrency: 10});
    }).then(function() {
        console.log('done, waiting for threads');
    }).catch(function(err) {
        console.error(err);
    });

var fix_notify_bindings = function(user, index, length) {
    return user_model.get(user.id).then(function(user) {
        bar.tick();

        if (!user_model.use_notify(user.username)) {
            log.error('- unable to fix bindings for ', user.username);
            return;
        }

        // user.active flag got messed up
        // re-check messages for STOP keyword
        return conversation_model.get_recent_by_user(user.id).then(function(conversation) {
            return msgs_model.get_by_conversation(conversation.id).then(function(messages) {
                return messages.reduce(function(canceled, m){
                    return canceled || language.is_cancel(m.body);
                }, false);
            });
        }).then(function(canceled) {
            if (canceled) {
                user.active = false;
                log.info(user.username, 'CANCELED');
            } else {
                user.active = true;
                // user didn't mean to cancel...
            }
            return user;
        }).then(function(user) {
            if(user.active === false) {
                if (!user.settings.notify_binding_sid) { return; }
                // actually remove binding
                return notify.delete_binding(user).then(function(sid) {
                    log.info('- deleted binding', sid);
                    return;
                }, function(error) {
                    log.error('- unable to delete binding', user.username);
                    user.settings.notify_binding_sid = null;
                    var update_user = util.object.set(user, 'settings.fixed_notify', true);
                    return user_model.update(user.id, update_user);
                });
            } else {
                var tags_add = [];
                var tags_del = [];
                // update completion tag with specific method
                // use same if-then structure as bot
                var already_registered = util.object.get(user, 'settings.already_registered');
                if (already_registered) {
                    tags_add.push('votebot-already-registered');
                    // by definition, if they are already registered, they didn't complete with us
                    tags_del.push('votebot-completed-mail');
                    tags_del.push('votebot-completed-pdf');
                    tags_del.push('votebot-completed-ovr');
                } else {
                    var form_type = util.object.get(user, 'settings.submit_form_type');
                    var mail_eta = util.object.get(user, 'settings.nvra_mail_eta');
                    if (form_type == 'NVRA') {
                        if (mail_eta) {
                            tags_add.push('votebot-completed-mail');
                        } else {
                            tags_add.push('votebot-completed-pdf');
                        }
                    } else if (form_type) {
                        tags_add.push('votebot-completed-ovr');
                    }
                    log.info('- updating binding', user.username, tags_add, tags_del);
                }

                return notify.add_tags(user, tags_add).then(function(sid) {
                    return notify.remove_tags(user, tags_del);
                }, function(error) {
                    log.info('- replace binding for ', user.username);
                    notify.delete_binding(user);
                    return notify.create_binding(user, tags_add);
                }).then(function(sid) {
                    // mark fixed, so we don't double dip
                    var update_user = util.object.set(user, 'settings.fixed_notify', true);
                    return user_model.update(user.id, update_user);
                });
            }
        });
    });
};