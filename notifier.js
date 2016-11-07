var config = require('./config');
var db = require('./lib/db');
var l10n = require('./lib/l10n');
var convo_model = require('./models/conversation');
var user_model = require('./models/user');
var moment = require('moment');
var notifications = require('./lib/notifications');
var log = require('./lib/logger');


var RUN_DELAY = 60000;
var NOTIFY_TIMEOUT = 10000;
var QUERY = [
    'SELECT     *',
    'FROM       users',
    'WHERE      active = true',
    
    /*
    'AND        created > \'2016-10-12\'',
    'AND        created < \'2016-10-13\'',
    */
    
    // 'AND        created < now() - \'24 hours\'::interval',

    /*
    'AND        (',
    '           last_notified IS NULL',
    '           OR',
    '           last_notified < now() - \'24 hours\'::interval',
    '           )',
    */

    'ORDER BY   id',
];

var run = function() {

    var time = moment(),
        startTime = moment('14:00:00', 'hh:mm:ss'),
        endTime = moment('23:59:59', 'hh:mm:ss');
    
    log.notice('CURRENT time is: ', time.toString());
    log.notice('Start time is: ', startTime.toString());
    log.notice('End time is: ', endTime.toString());

    if (!time.isBetween(startTime, endTime)) {
        log.notice(' - Time is not between 7am PST and 8pm EST! Waiting...');
        return setTimeout(run, RUN_DELAY);
    }
 
    db.query(
        QUERY.join('\n'))
        .then(function(users) {
            log.notice('Found users: ', users.length);
            return executeUserNotifications(users);
        });
};

var executeUserNotifications = function(userStack) {
    if (userStack.length == 0) {
        log.notice('No more users to notify. waiting a minute...');
        return setTimeout(run, RUN_DELAY);
    }

    var user = userStack.pop(),
        completed = 0;

    log.notice('Processing notifications for user: ', user.id);

    var processNotification = function(notification) {

        log.notice(' - Notification: ', notification.type);

        var nextNotification = function() {
            completed++;
            if (completed == notifications.length) {
                log.notice(' - DONE. Running next user...');
                return executeUserNotifications(userStack);
            } else if (completed > notifications.length) {
                log.error(' - COMPLETE AFTER TIMEOUT. WOW.');
                return 'whatever';
            } else {
                return processNotification(notifications[completed]);
            }
        }

        // Check that the notification hasn't been sent
        if (
            user.notifications
            &&
            user.notifications.sent
            &&
            user.notifications.sent.indexOf(notification.type) > -1
        ) {
            log.notice('    - USER TAGGED WITH THIS NOTIFICATION. NEXT!');
            return nextNotification();
        }

        return notification.process(user, function(result) {

            var doNext = function() {
                if (failTimeout) clearTimeout(failTimeout);
                return nextNotification();
            }
            var skipToNextUser = function() {
                log.notice(' - Triggered!!! Skipping to next user...');
                if (failTimeout) clearTimeout(failTimeout);
                return executeUserNotifications(userStack)
            }

            var failTimeout = setTimeout(function() {
                log.error(' - REACHED FAILURE TIMEOUT. PROCEEDING...');
                return doNext();
            }, NOTIFY_TIMEOUT);

            if (!result.chain && !result.mark_sent) {

                return doNext();

            } else {

                // first mark the user as having been sent this notification
                if (!user.notifications)
                    user.notifications = {};
                
                if (!user.notifications.sent)
                    user.notifications.sent = [];

                user.notifications.sent.push(notification.type);

                log.notice('    - Marking user as sent: ', notification.type);

                user_model.update(user.id, {
                    notifications: user.notifications,
                    last_notified: db.now()
                })
                    .then(function(_user) {

                        if (result.chain) {
                            log.notice('    - Switch chain: ', _user.id, result.chain);
                            convo_model.switch_chain(result.chain, user)
                                .then(function() {
                                    return skipToNextUser();
                                }).catch(function(err) {
                                    log.error('    - ERROR SWITCHING. OMG');
                                    return skipToNextUser();
                                });
                        } else {
                            return skipToNextUser();
                        }
                    }).catch(function(err) {
                        log.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1!!!1!11!1');
                        log.error('FAILED UPDATE USER NOTIFICATIONS FLAG', err);
                        log.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1!!!1!1!!1');
                        return process.exit(1);
                    });
            
            }
        });
    }

    return processNotification(notifications[0]);
}

run();