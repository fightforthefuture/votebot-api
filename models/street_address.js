var Promise = require('bluebird');
var request = require('request');
var config = require('../config');

exports.validate = function(street, city, state)
{
    return new Promise(function(resolve, reject) {
        var req_url = 'https://api.smartystreets.com/street-address'
            +'?auth-id='+config.smarty_streets.auth_id
            +'&auth-token='+config.smarty_streets.auth_token
            +'&street='+street+'&city='+city+'&state='+state;
        request(req_url, function(err, res, body) {
            if(err) return reject(err);
            if(res.statusCode >= 400) return reject(new Error('not_found'));
            try
            {
                var obj = JSON.parse(body) || {};
                var address_data = obj[0];

                if (!address_data) {
                    return reject(e);
                }
            }
            catch(e)
            {
                return reject(new Error('not_found'));
            }
            resolve(address_data);
        });
    });
};

