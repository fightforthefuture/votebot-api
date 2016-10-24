var Promise = require('bluebird');
var request = require('request');
var config = require('../config');

exports.shorten = function(url)
{
    return new Promise(function(resolve, reject) {
        var req_url = 'https://go.hello.vote'
            +'/api/create/?url=' + encodeURIComponent(url);

        console.log('shorten_url', url);

        request(req_url, function(err, res, body) {
            if(err) return reject(err);
            if(res.statusCode >= 400) return reject(new Error('not_found'));
            try
            {
                var short_url = body;
                return resolve(short_url);
            }
            catch(e)
            {
                return reject(e);
            }
        });
    });
};
