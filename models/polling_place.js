var Promise = require('bluebird');
var request = require('request');
var config = require('../config');

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

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
            if(res.statusCode >= 400) return reject(new Error('polling_place not_found'));
            try
            {
                var obj = JSON.parse(body) || {};
                var polling_place = obj.pollingLocations ? obj.pollingLocations[0] : {};

                if (obj.earlyVoteSites) {
                    // save early_voting to polling place as sub-object
                    polling_place.early = obj.earlyVoteSites[0];
                }

                if (!polling_place) {
                    return reject(new Error('no_polling_place'));
                }

                if (polling_place && polling_place.address) {
                    // google data is all upper case, transform city to TitleCase
                    polling_place.address.city = toTitleCase(polling_place.address.city);
                }
                if (polling_place && polling_place.early) {
                    if (polling_place.early) {
                        polling_place.early.address.city = toTitleCase(polling_place.early.address.city);
                    }
                }

                return resolve(polling_place);
            }
            catch(e)
            {
                return reject(e);
            }
        });
    });
};