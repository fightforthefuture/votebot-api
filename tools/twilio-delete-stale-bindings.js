var Promise = require('bluebird');
var ProgressBar = require('progress');
var log = require('../lib/logger');
var db = require('../lib/db');
var util = require('../lib/util');
var user_model = require('../models/user');
var notify = require('../models/notify');

var USERS_WITH_STALE_BINDINGS = [
    'SELECT id',
    'FROM   users',
    'WHERE  active = false',
    'AND created <= \'2016-10-04\'',
    'AND settings->>\'notify_binding_sid\' is not null'
];

var bar = new ProgressBar('[:bar] :current / :total :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: 0, // update this below
        });

db.query(
    USERS_WITH_STALE_BINDINGS.join('\n'))
    .then(function(users) {
        console.log();
        bar.total = users.length;
        return Promise.map(users, delete_notify_bindings, {concurrency: 10});
    }).then(function() {
        console.log('done, waiting for threads');
    }).catch(function(err) {
        console.error(err);
    });

var delete_notify_bindings = function(user, index, length) {
    return user_model.get(user.id).then(function(user) {
        bar.tick();

        if (!user_model.use_notify(user.username)) {
            log.error('- unable to delete bindings for ', user.username);
            return;
        }

        notify.delete_binding(user).then(function() {
            var update_user = util.object.set(user, 'settings.fixed_notify', true);
            return user_model.update(user.id, update_user);
        }).catch(function(error) {
            console.error('unable to delete binding for', user.id);
            reject(error);
        });
    });
};
