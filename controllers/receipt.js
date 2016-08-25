var resutil = require('../lib/resutil');
var util = require('../lib/util');
var express = require('express');
var user_model = require('../models/user');
var conversation_model = require('../models/conversation');
var bot_model = require('../models/bot');
var email = require('../lib/email');
var auth = require('../lib/auth');
var log = require('../lib/logger');
var error = require('../lib/error');
var config = require('../config');
var language = require('../lib/language');
var moment = require('moment-timezone');


exports.hook = function(app)
{
    app.post('/receipt/:username', create); // TODO, secure with auth.key shared with votebot-forms
};

var create = function(req, res)
{
    var username = req.params.username;
    var form_class = req.body.form_class ? req.body.form_class : 'unknown';
    var status = req.body.status ? req.body.status : 'failure';
    var reference = req.body.reference ? req.body.reference : -1;
    var user;
    var goto_step;
    var conversation;
    log.info('receipt: create', req.body);

    user_model.get_by_username(username).then(function(_user) {
        user = _user;
        return conversation_model.get_recent_by_user(user.id);
    }).then(function(_conversation) {
        conversation = _conversation;

        if (status == "success") {
            var update_user = util.object.set(user, 'settings.submit_success', true);
            update_user = util.object.set(update_user, 'settings.submit_form_type', form_class);
            goto_step = 'processed';
        } else if (form_class == "VoteDotOrg") {
            var update_user = util.object.set(user, 'settings.failed_vote_dot_org', true);
            update_user = util.object.set(update_user, 'settings.failure_reference', reference);
            goto_step = 'incomplete';
        } else {
            var update_user = util.object.set(user, 'settings.failed_ovr', true);
            goto_step = 'submit';
        }

        return user_model.update(user.id, update_user);
    }).then(function() {
        return conversation_model.goto_step(conversation.id, goto_step);
    }).then(function(updated_converstation) {
        bot_model.next(user.id, updated_converstation);

        if (status !== 'success') {
            resutil.error(res, 'Oh no!');
            return;
        }

        var msg_parts = [
            "Thanks for registering to vote with HelloVote!",
            "Your receipt is attached:",
            "- Name: {{first_name}} {{last_name}}",
            "- Address: {{settings.address}} {{settings.city}} {{settings.state}}",
        ];
        if (user.settings.state_id_number) { msg_parts.push("- State ID: {{settings.state_id_number}}"); }
        if (user.settings.ssn_last4) { msg_parts.push("- SSN: ****"); }
        
        local_time = moment.tz(user.settings.timezone).format('MM/DD/YYYY h:mm A z');
        // if timezone parsing doesn't work, they'll still get UTC, so show complete timezone
        msg_parts.push("- Submitted: "+local_time);
        msg_parts.push("Make sure to tell your friends, share https://fftf.io/hellovote");

        var templated_msg = language.template(msg_parts.join('<br/>'), user);

        return email.create([user.settings.email], 'Your HelloVote Registration Receipt', templated_msg)
            .then(function(emailResult) {
                resutil.send(res, emailResult);
            })
            .catch(function(err) {
                resutil.error(res, 'Problem sending email receipt', err);
                log.error('Unable to send email receipt', {user_email: [user.settings.email]});
            });

    });
};

// smarty streets gives us tz like "Pacific", so we have to add links to proper tz names
moment.tz.link([
    'America/Anchorage|Alaska',
    'America/Honolulu|Hawaii',
    'America/Los_Angeles|Pacific',
    'America/Denver|Mountain',
    'America/Chicago|Central',
    'America/New_York|Eastern',
]);
