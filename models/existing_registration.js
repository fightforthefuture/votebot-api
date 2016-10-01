var Promise = require('bluebird');
var config = require('../config');
var request = require('request');
var moment = require('moment');
var util = require('../lib/util');

exports.verify = function(user)
{
    return new Promise(function(resolve, reject) {
        var date_of_birth = moment(util.object.get(user, 'settings.date_of_birth'), 'YYYY-MM-DD');
        var query_data = {
            "first_name": util.object.get(user, 'first_name'),
            "last_name": util.object.get(user, 'last_name'),
            "street_name": util.object.get(user, 'settings.street_name'),
            "city": util.object.get(user, 'settings.city'),
            "state": util.object.get(user, 'settings.state'),
            "zip_code": util.object.get(user, 'settings.zip'),
            "dob": date_of_birth.format("YYYY*") // just send year to TargetSmart
            // they do an exact match on what they have, but their default value for unknowns is 0101
            // which is not helpful. so, just match on year now and filter later
        }

        var request_options = {
            url: 'https://api.targetsmart.com/voter-registration-check',
            qs: query_data,
            headers: {'x-api-key': config.target_smart.api_key}
        };
        request.get(request_options, function(err, res, body) {
                if(err) return reject(err);
                if(res.statusCode >= 400) return reject(new Error('targetsmart_server_error'));
                try
                {
                    var obj = JSON.parse(body) || {};
                    if (obj.result) {
                        var registration_status = obj.result_set[0]['vb.voterbase_registration_status']; 
                        var is_registered = (registration_status === "Registered");
                        var vb_dob = moment(obj.result_set[0]['vb.voterbase_dob'], 'YYYYMMDD');
                        var matched_dob = (date_of_birth.isSame(vb_dob) ||
                                           (date_of_birth.isSame(vb_dob, 'year') && vb_dob.month() === 0 && vb_dob.day() === 0));
                    } else {
                        return resolve([false]);
                    }
                }
                catch(e)
                {
                    return reject(e);
                }
            }
        );
    });
}
