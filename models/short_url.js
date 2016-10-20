var Promise = require('bluebird');
var google_url = require('google-url');
var config = require('../config');

exports.shorten = function(url)
{
    googleUrl = new google_url({key: config.google_civic.api_key});
    return new Promise(function(resolve, reject) {
        googleUrl.shorten(url, function( err, shortUrl ) {
            console.log('shortUrl', shortUrl);
            if(err) {
                return reject(err);
            }
            return resolve(shortUrl);
        });
    });
};