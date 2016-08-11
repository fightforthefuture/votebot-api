var Promise = require('bluebird');
var config = require('../config');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');


exports.create = function(to, subject, text)
{
    var transporter = nodemailer.createTransport(smtpTransport(config.mail.smtp));
    var emailOptions = {
        from: config.mail.from,
        to: to.join(','),
        subject: subject,
        text: text
    };

    return new Promise(function(resolve, reject) {
        transporter.sendMail(emailOptions, function(err, data) {
            if (err) {
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
};

