var config = require('../config');
var db = require('../lib/db');
var util = require('../lib/util');
var user_model = require('../models/user');
var notify = require('../models/notify');

var USERS_TO_BE_FIXED = [
    'SELECT *',
    'FROM   users',
    'WHERE  complete = true',
    "AND    date(created) <= '2016-10-04'",
    "AND    settings->>'fixed_notify' is null",
    "LIMIT 1000",
];

db.query(
    USERS_TO_BE_FIXED.join('\n'))
    .then(function(users) {
        console.log('Found users: ', users.length);
        return fix_notify_bindings(users);
    });

var fix_notify_bindings = function(stack) {
    if (stack.length == 0) {
        console.log('Nothing more to do. kthxbai');
        process.exit(0);
    }

    var user = stack.shift();
    if ( !user.first_name || !user.last_name ) {
        console.log('Skipping user ', user.id, ' no name...');
        return fix_notify_bindings(stack);
    }

//    console.log('Fixing notify bindings for user: ', user.id);

    return user_model.get(user.id).then(function(user) {
        if (!user_model.use_notify(user.username)) {
            console.log('- unable to fix bindings for ', user.username);
            return fix_notify_bindings(stack);
        }

        if(user.active = false) {
            //actually remove binding
            //console.log('- delete binding for', user.id);
            try {
                notify.delete_binding(user);
            } catch(err) {
                console.error('- unable to delete binding', user.id);
            }
        } else {
            // update completion tag with specific method
            // use same if-then structure as bot

            var form_type = util.object.get(user, 'settings.submit_form_type');
            var mail_eta = util.object.get(user, 'settings.nvra_mail_eta');
            try {
                if (form_type != 'NVRA') {
                    notify.add_tags(user, ['votebot-completed-ovr']);
                } else {
                    if (mail_eta) {
                        notify.add_tags(user, ['votebot-completed-mail']);
                    } else {
                        notify.add_tags(user, ['votebot-completed-pdf']);
                    }
                }
                //console.log(' - fixed binding for ', user.id);
            } catch(err) {
                console.err('- unable to update binding for ', user.id);
            }
        }

        // mark fixed, so we don't double dip
        var update_user = util.object.set(user, 'settings.fixed_notify', true);
        user_model.update(user.id, update_user);

        return fix_notify_bindings(stack);
    }).catch(function(error) {
        return fix_notify_bindings(stack);
    });
};