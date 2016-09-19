var Promise = require('bluebird');
var request = require('request');
var moment = require('moment');
var util = require('../lib/util');

exports.verify = function(user)
{
    return new Promise(function(resolve, reject) {
        var date_of_birth = moment(util.object.get(user, 'settings.date_of_birth'), 'YYYY-MM-DD');
        var form_data = {
            "cons_info_component": "t",
            "source": "WEBSITE",
            "cons_first_name": util.object.get(user, 'first_name'),
            "cons_last_name": util.object.get(user, 'last_name'),
            "cons_gender": util.object.get(user, 'settings.gender'),
            "cons_street1": util.object.get(user, 'settings.address'),
            "cons_street2": util.object.get(user, 'settings.address_unit'),
            "cons_city": util.object.get(user, 'settings.city'),
            "cons_state": util.object.get(user, 'settings.state'),
            "cons_zip_code": util.object.get(user, 'settings.zip'),
            "cons_email": util.object.get(user, 'settings.email'),
            "birth_date_day": date_of_birth.day(),
            "birth_date_month": date_of_birth.month(),
            "birth_date_year": date_of_birth.year()
        };
        
        var req_url = 'https://www.am-i-registered-to-vote.org/verify-registration.php';
        request.post(req_url, { form: form_data },
            function(err, res, body) {
                if(err) return reject(err);
                if(res.statusCode >= 400) return reject(new Error('rtv_server_error'));
                try
                {   
                    var success_string = "AWESOME!";
                    if (body.indexOf(success_string)) {
                        return resolve([true]);
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
