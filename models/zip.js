var Promise = require('bluebird');
var request = require('request');
var config = require('../config');

exports.find = function(zip)
{
	return new Promise(function(resolve, reject) {
        var req_url = 'https://us-zipcode.api.smartystreets.com/lookup'
            +'?auth-id='+config.smarty_streets.auth_id
            +'&auth-token='+config.smarty_streets.auth_token
            +'&zipcode='+zip;
        request(req_url, function(err, res, body) {
            if(err) return reject(err);
            if(res.statusCode >= 400) return reject(new Error('zip not_found'));
            try
            {
                var obj = JSON.parse(body) || {};
                obj = obj[0];

				// normalize our zip data
				var zipdata = {
					code: zip,
					places: (obj.city_states || [])
						.map(function(city_state) {
							if(!city_state) return false;
							return {
								city: city_state['city'],
								state: city_state['state_abbreviation']
							}
						})
						.filter(function(p) { return !!p; })
				};
            }
            catch(e)
            {
                return reject(e);
            }
            resolve(zipdata);
        });
    });
};

