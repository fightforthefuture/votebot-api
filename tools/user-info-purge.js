var Promise = require('bluebird');
var ProgressBar = require('progress');
var config = require('../config');
var log = require('../lib/logger');
var db = require('../lib/db');
var util = require('../lib/util');
var user_model = require('../models/user');
var msgs_model = require('../models/message');

var USERS_ALL = [
    'SELECT id, settings',
    'FROM   users'
];

var bar = new ProgressBar('[:bar] :current / :total :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: 0, // update this below
        });

db.query(
    USERS_ALL.join('\n'))
    .then(function(users) {
        console.log();
        bar.total = users.length;
        return Promise.map(users, purge_user_info, {concurrency: 10});
    }).then(function() {
        console.log('done, waiting for threads');
    }).catch(function(err) {
        console.error(err);
    });

var purge_user_info = function(user, index, length) {
    return user_model.get(user.id).then(function(user) {
        bar.tick();

        if (!user.settings) {
            return;
        }

        // reconstruct settings obj with only the info we need to match to catalist
        var cleaned_settings = {
            // minimum to match to catalist
            'address': user.settings.address,
            'city': user.settings.city,
            'state': user.settings.state,
            'zip': user.settings.zip,
            'date_of_birth': user.settings.date_of_birth,

            // useful for fftf opt-in to action network
            'fftf_opt_in': user.settings.fftf_opt_in,
            'email': user.settings.email,

            // useful for our own analysis
            'already_registered': user.settings.already_registered,
            'submit_form_type': user.settings.submit_form_type,
            'mail_letter': user.settings.mail_letter,
            'include_postage': user.settings.include_postage,
            'confirm_ovr_disclosure': user.settings.confirm_ovr_disclosure,

            'started_early_voting': user.settings.started_early_voting,
            'started_mail_in': user.settings.started_mail_in,
            'started_share': user.settings.started_share,
            'started_commit_to_vote': user.settings.started_commit_to_vote,
            'started_gotv_1': user.settings.started_gotv_1,
            'started_gotv_2': user.settings.started_gotv_2,
            'started_gotv_3': user.settings.started_gotv_3,
            'started_gotv_4': user.settings.started_gotv_4,
            'vote_time': user.settings.vote_time,
            'timezone': user.settings.timezone
        };

        update_user = util.object.set(user, 'settings', cleaned_settings);
        return user_model.update(user.id, update_user);
    });
};