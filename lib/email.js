var Promise = require('bluebird');
var config = require('../config');
var template = require('swig');
var us_states = require('./us_states');
var us_election = require('./us_election');
var moment = require('moment-timezone');
var marked = require('marked');
var sparkpost, client;

template.setDefaults({
    cache: false,
    autoescape: false
});

exports.create = function(to, subject, text)
{
    sparkpost = require("sparkpost");
    client = new sparkpost(config.sparkpost_api_key);

    var recipientsFormatted = [];

    for (var i = 0; i < to.length; i++) {
        recipientsFormatted.push({address: to[i]});
    }

    return new Promise(function(resolve, reject) {
        client.transmissions.send({
          transmissionBody: {
            content: {
              from: {
                name: 'HelloVote',
                email: config.mail.from
              },
              subject: subject,
              html: text
            },
            recipients: recipientsFormatted
          }
        }, function(err, data) {
            if (err) {
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
};

exports.sendNVRAReceipt = function(user, pdf_url) {
  var tmpl = template.compileFile('templates/receipt_nvra.html'),
      subj = '**IMPORTANT** More steps to register to vote!',
      state_name = us_states.abbr_to_name(user.settings.state),
      requirements = us_election.get_registration_requirements(state_name),
      verificationInfo = getVerificationInfo(requirements),
      verify = verificationInfo.verify,
      markdown_verify_text = verificationInfo.markdown_verify_text,
      deadline_text = getDeadlineText(requirements, state_name);

  var body = tmpl({
    user: user,
    pdf_url: pdf_url,
    verify: verify,
    markdown_verify_text: markdown_verify_text,
    deadline_text: deadline_text
  });

  return exports.create([user.settings.email], subj, body);
}

exports.sendOVRReceipt = function(user) {
  var tmpl = template.compileFile('templates/receipt_ovr.html'),
      subj = '**PLEASE REVIEW** Your HelloVote registration receipt',
      state_name = us_states.abbr_to_name(user.settings.state),
      requirements = us_election.get_registration_requirements(state_name),
      ovr_site_url = us_election.state_confirmation_disclosures[user.settings.state].ovr_site_url,
      friendly_timestamp = moment().tz('America/Los_Angeles').format('MMMM D, YYYY - h:mm A z'),
      verificationInfo = getVerificationInfo(requirements),
      verify = verificationInfo.verify,
      markdown_verify_text = verificationInfo.markdown_verify_text,
      deadline_text = getDeadlineText(requirements, state_name);

  var body = tmpl({
    user: user,
    ovr_site_url: ovr_site_url,
    state_name: state_name,
    friendly_timestamp: friendly_timestamp,
    verify: verify,
    markdown_verify_text: markdown_verify_text,
    deadline_text: deadline_text
  });

  return exports.create([user.settings.email], subj, body);
}

exports.sendMailReceipt = function(user, mail_eta, mail_carrier) {
  var tmpl = template.compileFile('templates/receipt_mail.html'),
      subj = 'Your voter registration form is on its way!',
      state_name = us_states.abbr_to_name(user.settings.state),
      requirements = us_election.get_registration_requirements(state_name),
      friendly_timestamp = moment().tz('America/Los_Angeles').format('MMMM D, YYYY - h:mm A z'),
      friendly_eta = moment(mail_eta).tz('America/Los_Angeles').format('MMMM D'),
      verificationInfo = getVerificationInfo(requirements),
      verify = verificationInfo.verify,
      markdown_verify_text = verificationInfo.markdown_verify_text,
      deadline_text = getDeadlineText(requirements, state_name);

  var body = tmpl({
    user: user,
    state_name: state_name,
    friendly_timestamp: friendly_timestamp,
    friendly_eta: friendly_eta,
    mail_carrier: mail_carrier,
    verify: verify,
    markdown_verify_text: markdown_verify_text,
    deadline_text: deadline_text
  });

  return exports.create([user.settings.email], subj, body);
}

var getDeadlineText = function(requirements, state_name) {
  var deadline_text = '';
  if (requirements && requirements["Deadlines"]) {
    if (requirements["Deadlines"]["received-by"]) {
      var deadline = moment(requirements["Deadlines"]["received-by"]).format('MMMM D')
      deadline_text = 'Registrations must be received by '+deadline+' in '+state_name;
    } else if (requirements["Deadlines"]["mail-by"]) {
      var deadline = moment(requirements["Deadlines"]["mail-by"]).format('MMMM D')
      deadline_text = 'The mailing deadline for '+state_name+' is '+deadline;
    }
  }
  if (!deadline_text) {
    deadline_text = 'The mailing deadline is soon';
  }
  return deadline_text;
}

var getVerificationInfo = function(requirements) {
  var markdown_verify_text = false;
  if (requirements && requirements["CheckRegistration"]) {
    if (requirements["CheckRegistration"].indexOf('http') === 0) {
      var verify = requirements["CheckRegistration"];
    } else {
      var verify = marked(requirements["CheckRegistration"]).replace('<p>', '').replace('</p>', '').trim();
      markdown_verify_text = true;
    }
  } else {
    var verify = 'https://am-i-registered-to-vote.org/';
  }
  return {
    verify: verify,
    markdown_verify_text: markdown_verify_text
  }
}