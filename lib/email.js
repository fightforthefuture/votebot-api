var Promise = require('bluebird');
var config = require('../config');
var sparkpost, client;

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
              from: config.mail.from,
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