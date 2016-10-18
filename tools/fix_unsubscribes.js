var pg = require('pg');
var moment = require('moment');
var language = require('../lib/language');
var user_model = require('../models/user');
var notify = require('../models/notify');
var convo_model = require('../models/conversation');
var Promise = require('bluebird');
var db = require('../lib/db');

pg.defaults.ssl = true;

var query = [
    'SELECT     m.body, m.created, u.id, u.username, u.active, u.settings',
    'FROM       messages m, users u',
    'WHERE      u.id = m.user_id',
    'AND        m.user_id > 1',
].join('\n');



db.query(query).then(function(result) {
    console.log('got results: ', result.length);
    var total = 0,
        ca = 0;

    return Promise.all(result.map(function(row) {
        if (language.is_cancel(row.body) && row.active) {
            console.log('Erroneously subscribed: ', row.id, row.body);
            total++;
            if (row.settings && row.settings.state == 'CA') {
                console.log(' - IS CALIFORNIA');
                ca++;
            }
            console.log(' - Selecting user...');
            var user;
            return user_model.get(row.id)
                .then(function(_user) {
                    user = _user;
                    console.log(' - Deactivating...');
                    return user_model.update(row.id, {active: false});
                }).then(function(_user2) {
                    if (
                        user_model.use_notify(user.username)
                        &&
                        user.settings.notify_binding_sid
                    ) {
                        console.log(' - Deleting binding...');
                        return notify.delete_binding(user);
                    } else {
                        console.log(' - No binding to delete :)');
                        return true;
                    }
                })
        }
    })).finally(function() {
        console.log('total erroneously still subscribed: ', total);
        console.log('california: ', ca);
        process.exit(0);
    });
   
});
