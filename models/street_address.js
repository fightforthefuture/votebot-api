var Promise = require('bluebird');
var request = require('request');
var config = require('../config');

exports.validate = function(street, city, state, zip)
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

                if (address_data) {
                    return resolve(address_data);

                // We didn't get any data. Fall back to a more relaxed API
                } else {

                    var req_url = 'https://extract-beta.api.smartystreets.com/'
                        +'?auth-id='+config.smarty_streets.auth_id
                        +'&auth-token='+config.smarty_streets.auth_token

                    request.post(
                        {
                            url: req_url,
                            body : street + (zip ? ' ' + zip : ''),
                            headers: {'Content-Type': 'text/plain'}
                        },
                        function (err, res, body) {    

                            if(err)
                                return reject(err);

                            if(res.statusCode >= 400)
                                return reject(new Error('not_found'));

                            var obj = JSON.parse(body) || {};
                            var address_data = null;

                            if (
                                obj['addresses']
                                &&
                                obj['addresses'].length
                                &&
                                obj['addresses'][0]['api_output']
                                &&
                                obj['addresses'][0]['api_output'].length
                            )
                            {
                                var address_data = obj['addresses'][0]['api_output'][0];
                            }

                            if (address_data) {
                                return resolve(address_data);
                            } else {
                                return reject(new Error('not_found'));
                            }
                        }
                    );
                }
            }
            catch(e)
            {
                return reject(e);
            }
        });
    });
};