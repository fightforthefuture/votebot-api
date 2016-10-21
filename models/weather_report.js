var Promise = require('bluebird');
var request = require('request');
var config = require('../config');

exports.forecast = function(city, state, days_out)
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
        if(days_out > 7) { days_out = 7; }

        request(req_url, function(err, res, body) {
            if(err) return reject(err);
            if(res.statusCode >= 400) return reject(new Error('not_found'));
            try
            {
                var obj = JSON.parse(body) || {};
                var forecast_day = obj.forecast.forecastday[days_out - 1];
                if (forecast_day && forecast_day.day) {
                    var condition = forecast_day.day.condition.text.toLowerCase();
                    // simplify apixu conditions, remove uncertainty
                    var simple_text = condition.replace('patchy', '')
                        .replace('outbreaks', '')
                        .replace('light', '')
                        .replace('moderate', '')
                        .replace('heavy', '')
                        .replace('showers', '')
                        .replace('shower', '')
                        .replace('torrential', '')
                        .replace('in nearby', '')
                        .replace('nearby', '')
                        .replace('in area', '')
                        .replace('at times', '')
                        .replace('or', '')
                        // .replace('with', '')
                        .trim();

                    // convert to adjective
                    var adj;
                    switch(simple_text) {
                        case 'rain':
                            adj = 'rainy'; break;
                        case 'mist':
                            adj = 'misty'; break;
                        case 'fog':
                            adj = 'foggy'; break;
                        case 'snow':
                            adj = 'snowy'; break;
                        case 'sleet':
                        case 'ice pellets':
                        case 'freezing rain':
                            adj = 'sleeting'; break;
                        default:
                            adj = simple_text; break;
                    }

                    return resolve({condition: condition,
                                    simple_text: simple_text,
                                    adjective: adj});
                }
            }
            catch(e)
            {
                return reject(e);
            }
        });
    });
};