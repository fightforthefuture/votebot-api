var Promise = require('bluebird');
var request = require('request');
var config = require('../config');

exports.lookup = function(street, city, state)
{
    return new Promise(function(resolve, reject) {
        var req_url = 'https://www.googleapis.com/civicinfo/v2/voterinfo'
            +'?electionId='+config.google_civic.election_id
            +'&key='+config.google_civic.api_key;

        if (!city && !state)
            req_url += '&address='+street;
        else
            req_url += '&address='+street+' '+city+' '+state;
        
        request(req_url, function(err, res, body) {
            if(err) return reject(err);
            if(res.statusCode >= 400) return reject(new Error('not_found'));
            try
            {
                var obj = JSON.parse(body) || {};
                var polling_place = obj.pollingLocations[0];

                if (polling_place) {
                    return resolve(polling_place);
                }
            }
            catch(e)
            {
                return reject(e);
            }
        });
    });
};