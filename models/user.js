var config = require('../config');
var db = require('../lib/db');
var validate = require('../lib/validate');

/**
 * takes a mobile number or chat username and turns it into a standard format
 */
exports.parse_username = function(username, options)
{
	options || (options = {});

	if(username.startsWith('Messenger:')){
		//is a facebook messenger username
		return {
			username: username,
			type: 'fb'
		};
	} else if (username.startsWith('Web:')) {
		//is a web username
		return {
			username: username,
			type: 'web'
		}
	} else {
		parsed_phone = validate.phone(username, options.country);
		if (parsed_phone) {
			//is a phone number
			return {
				username: parsed_phone,
				type: 'sms'
			};
		} else {
			return;
		}
	}
};

exports.use_notify = function(username) {
	if (!config.twilio) { return false; }
	var type = exports.parse_username(username).type;
	if (type === 'fb' || type === 'sms') { return true; }
	return false;
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
		var new_user = exports.parse_username(username);
		new_user.created = db.now();
		return exports.upsert(new_user);
	}));
};

exports.wipe = function(username)
{
	var user_id;
	return db.one('SELECT id FROM users WHERE username = {{username}}', {username: username})
		.then(function(user) {
			if(!user) throw new Error('that user wasn\'t found');
			user_id = user.id;
			return db.query('SELECT conversation_id FROM conversations_recipients WHERE user_id = {{id}}', {id: user_id});
		})
		.then(function(convos) {
			var ids = convos.map(function(c) { return c.conversation_id; });
			if(!ids.length) return;
			var convo_ids = ids.join(',');
			return [
				db.query('DELETE FROM conversations WHERE id IN ({{ids|raw}})', {ids: convo_ids}),
				db.query('DELETE FROM conversations_recipients WHERE conversation_id IN ({{ids|raw}})', {ids: convo_ids})
			];
		})
		.then(function() {
			return db.query('DELETE FROM users WHERE id = {{id}}', {id: user_id});
		});
};

