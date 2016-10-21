var Promise = require('bluebird');
var request = require('request');
var config = require('../config');

var zipcodes = require('../lib/zipcodes');

exports.from_zipcode = function(zipcode)
{
    return new Promise(function(resolve, reject) {
        var z = zipcodes.lookup[zipcode];
        if (z) {
            return resolve(z.timezone);
        } else {
            return reject(zipcode);
        }
    });
};

exports.from_city_state = function(city, state) {
    return new Promise(function(resolve, reject) {
        var req_url = 'https://api.timezonedb.com/'
            +'/v2/get-time-zone?format=json&key=' + config.timezonedb.key;

        if (city && state) {
            req_url += '&by=city'+'&city='+city+'%20'+state+'&country=US';
        } else {
            return reject('need city and state to look up timezone online');
        }

        request(req_url, function(err, res, body) {
            if(err) return reject(err);
            if(res.statusCode >= 400) return reject(new Error('timezone not_found'));
            try
            {
                var obj = JSON.parse(body) || {};
                return resolve({name: obj.zoneName});
            }
            catch(e)
            {
                return reject(e);
            }
        });
    });
};
