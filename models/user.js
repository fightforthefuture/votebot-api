var db = require('../lib/db');
var phone = require('phone');

/**
 * takes a mobile number or chat username and turns it into a standard format
 */
exports.parse_username = function(number, options)
{
	options || (options = {});

	if(number.startsWith('messenger:')){
		//is a chat username
		return {
			username: number,
			type: 'facebook-messenger'
		};
	}else{
		parsed_phone = phone(number, options.country)[0];
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
		return exports.upsert(exports.parse_username(username));
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

