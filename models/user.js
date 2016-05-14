var db = require('../lib/db');
var phone = require('phone');

/**
 * takes a mobile number and turns it into a standard format
 */
exports.parsenum = function(number, options)
{
	options || (options = {});

	if(options.country) var processed = phone(number, options.country);
	else var processed = phone(number);

	return processed[0];
};

exports.get = function(id)
{
	return db.one('SELECT * FROM users WHERE id = {{id}}', {id: id});
};

exports.get_by_username = function(username)
{
	return db.one('SELECT * FROM users WHERE username = {{username}} LIMIT 1', {username: username});
};

exports.upsert = function(userdata)
{
	return db.upsert('users', userdata, 'username');
};

exports.update = function(user_id, userdata)
{
	return db.update('users', user_id, userdata);
};

exports.batch_create = function(usernames)
{
	return Promise.all((usernames || []).map(function(username) {
		return exports.upsert({username: exports.parsenum(username)});
	}));
};

