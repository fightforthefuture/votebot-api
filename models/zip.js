var Promise = require('bluebird');
var request = require('request');

exports.find = function(zip)
{
	return new Promise(function(resolve, reject) {
		request('http://api.zippopotam.us/us/'+zip, function(err, res, body) {
			if(err) return reject(err);
			if(res.statusCode >= 400) return reject(new Error('not_found'));
			try
			{
				var obj = JSON.parse(body) || {};

				// normalize our zip data
				var zipdata = {
					code: obj['post code'],
					places: (obj.places || [])
						.map(function(place) {
							if(!place) return false;
							return {
								city: place['place name'],
								state: place['state abbreviation']
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

