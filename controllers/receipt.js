var resutil = require('../lib/resutil');
var express = require('express');
var user_model = require('../models/user');
var email = require('../lib/email');
var auth = require('../lib/auth');
var log = require('../lib/logger');
var error = require('../lib/error');
var config = require('../config');
var language = require('../lib/language');
var moment = require('moment-timezone');


exports.hook = function(app)
{
    app.post('/receipt/:id', create); // TODO, secure with auth.key shared with votebot-forms
};

var create = function(req, res)
{
    var user_id = req.params.id;
    log.info('receipt: create', req.body);
    // check votebot-forms submit status
    if (req.body.status !== 'success') {
        resutil.error(res, 'Problem submitting voter registration form');
        log.notice('Unable to submit user form', {user_id: user_id, votebot_forms: req.body});
        return;
    }

    user_model.get(user_id).then(function(user) {

        // TODO, replace with handlebars?
        // super simple text templating
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
        return [user.settings.email, templated_msg];
    }).spread(function(to_address, msg) {
        return email.create([to_address], 'Your HelloVote Registration Receipt', msg)
            .then(function(emailResult) {
                resutil.send(res, emailResult);
            })
            .catch(function(err) {
                resutil.error(res, 'Problem sending email receipt', err);
                log.error('Unable to send email receipt', {user_email: [to_address]});
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
