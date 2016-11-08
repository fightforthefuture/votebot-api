var config = require('./config');
var db = require('./lib/db');
var l10n = require('./lib/l10n');
var convo_model = require('./models/conversation');
var user_model = require('./models/user');
var notifications = require('./lib/notifications');
var log = require('./lib/logger');
var Promise = require('bluebird');
var moment = require('moment-timezone');


var RUN_DELAY = 60000;
var NOTIFY_TIMEOUT = 10000;
var QUERY = [
    'SELECT     *',
    'FROM       users',
    'WHERE      active = true',
    'AND        id > 1',
    
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

    var time = moment().tz('America/New_York');
    
    log.notice('CURRENT time is (America/New_York): ', time.toString());
    log.notice('... the hour is: ', time.hour());

    if (time.hour() < 10 || time.hour() > 20) {
        log.notice(' - Time is not between 7am PST and 10pm EST! Waiting...');
        return setTimeout(run, RUN_DELAY);
    }
 
    db.query(
        QUERY.join('\n'))
        .each(executeUserNotification)
        .then(function() {
            log.notice(' - Got to the end of the database. Yay!');
            return setTimeout(run, RUN_DELAY);
        });
};

var executeUserNotification = function(user) {
    
    log.notice('Processing notifications for user: ', user.id);

    return Promise.each(notifications, function(notification) {

        log.notice(' - Notification: ', notification.type);

        // Check that the notification hasn't been sent
        if (
            user.notifications
            &&
            user.notifications.sent
            &&
            user.notifications.sent.indexOf(notification.type) > -1
        ) {
            log.notice('    - USER TAGGED WITH THIS NOTIFICATION. NEXT!');
            return;
        }

        var result = notification.process(user)

        var skipToNextUser = function() {
            throw('(not an error)');
        }

        if (!result.chain && !result.mark_sent) {

            return;

        } else {

            // first mark the user as having been sent this notification
            if (!user.notifications)
                user.notifications = {};
            
            if (!user.notifications.sent)
                user.notifications.sent = [];

            user.notifications.sent.push(notification.type);

            log.notice('    - Marking user as sent: ', notification.type);

            return user_model.update(user.id, {
                notifications: user.notifications,
                last_notified: db.now()
            }).catch(function(err) {
                log.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1!!!1!11!1');
                log.error('FAILED UPDATE USER NOTIFICATIONS FLAG', err);
                log.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1!!!1!1!!1');
                return process.exit(1);
            }).then(function(_user) {

                if (result.chain) {
                    log.notice('    - Switch chain: ', _user.id, result.chain);
                    return convo_model.switch_chain(result.chain, user)
                        .timeout(NOTIFY_TIMEOUT)
                        .then(function() {
                            log.notice('    - Switch chain: SWITCHING TO NEXT USER LOL');
                            return skipToNextUser();
                        })
                } else {
                    return skipToNextUser();
                }
            })
        
        }
    }).catch(function(error) {
        log.notice(' - Triggered!!! Skipping to next:', error);
    });
}

run();