var Promise = require('bluebird');
var request = require('request');
var config = require('../config');

exports.forecast_day = function(city, state, days_out)
{
    return new Promise(function(resolve, reject) {
         var req_url = 'http://api.apixu.com'
            +'/v1/forecast.json?key=' + config.apixu.key + '&days=' + days_out;

        if (city && state) {
            req_url += '&q='+' '+city+', '+state;
        } else {
            // auto ip lookup request
            req_url += '&q=auto:ip'
        }

        if(!days_out) { days_out = 1; }

        request(req_url, function(err, res, body) {
            if(err) return reject(err);
            if(res.statusCode >= 400) return reject(new Error('not_found'));
            try
            {
                var obj = JSON.parse(body) || {};
                var forecast_day = obj.forecast.forecastday[days_out - 1];
                if (forecast_day && forecast_day.day) {
                    return resolve(forecast_day.day);
                }
            }
            catch(e)
            {
                return reject(e);
            }
        });
    });
};