var config = require('./config');
var db = require('./lib/db');
var l10n = require('./lib/l10n');
var convo_model = require('./models/conversation');
var user_model = require('./models/user');
var moment = require('moment');
var notifications = require('./config.notifications');

var RUN_DELAY = 60000;
var RUN_DELAY = 1000;
var QUERY = [
    'SELECT *',
    'FROM   users',
    'WHERE  active = true',
//    'AND    created < now() - \'24 hours\'::interval',
];

var run = function() {

    var time = moment(),
        startTime = moment('14:00:00', 'hh:mm:ss'),
        endTime = moment('23:59:59', 'hh:mm:ss');
    
    console.log('The time is: ', time.toString());
    if (!time.isBetween(startTime, endTime)) {
        console.log(' - Time is not between 9am PST and 8pm EST! Waiting...');
        return setTimeout(run, RUN_DELAY);
    }
 
    db.query(
        QUERY.join('\n'))
        .then(function(users) {
            console.log('Found users: ', users.length);
            return executeUserNotifications(users);
        });
};

var executeUserNotifications = function(userStack) {
    if (userStack.length == 0) {
        console.log('No more users to notify. waiting a minute...');
        return setTimeout(run, RUN_DELAY);
    }

    var processNotification = function(notification) {

        console.log(' - Notification: ', notification.type);

        var nextNotification = function() {
            completed++;
            if (completed == notifications.length) {
                console.log(' - DONE. Running next user...');
                return executeUserNotifications(userStack);
            } else if (completed > notifications.length) {
                console.error(' - COMPLETE AFTER TIMEOUT. WOW.');
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
            console.log('    - USER TAGGED WITH THIS NOTIFICATION. NEXT!');
            return nextNotification();
        }

        return notification.process(user, function(result) {

            var doNext = function() {
                if (failTimeout) clearTimeout(failTimeout);
                return nextNotification();
            }

            var failTimeout = setTimeout(function() {
                console.error(' - REACHED FAILURE TIMEOUT. PROCEEDING...');
                return doNext();
            }, 10000);

            if (false && result.chain || result.mark_sent) {

                // first mark the user as having been sent this notification
                if (!user.notifications)
                    user.notifications = {};
                
                if (!user.notifications.sent)
                    user.notifications.sent = [];

                user.notifications.sent.push(notification.type);

                console.log('    - Marking user as sent: ', notification.type);

                user_model.update(user.id, {notifications: user.notifications})
                    .then(function(_user) {
                        if (result.chain) {
                            console.log('    - Switch chain: ', result.chain);
                            convo_model.switch_chain(result.chain, user)
                                .then(function() {
                                    return doNext();
                                }).catch(function(err) {
                                    console.error('    - ERROR SWITCHING. OMG');
                                    return doNext();
                                });
                        } else {
                            return doNext();
                        }
                    }).catch(function(err) {
                        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1!!!1!');
                        console.error('FAILED UPDATE USER NOTIFICATIONS FLAG');
                        console.error(err);
                        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1!!!1!');
                        return process.exit(1);
                    });
            
            } else {
                return doNext();
            }
        });
    }

    var user = userStack.shift(),
        completed = 0;

    console.log('Processing notifications for user: ', user.id);

    return processNotification(notifications[0]);
}

run();