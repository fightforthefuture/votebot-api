var config = require('../config');
var db = require('../lib/db');
var phone = require('phone');
var uuid = require('node-uuid');

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
	} else if (username.startsWith('Revere:')) {
		//is a Revere / Revolution Messaging username
		return {
			username: username,
			type: 'revere'
		}
	} else if (username.startsWith('Skype:')) {
		//is a web username
		return {
			username: username,
			type: 'skype'
		}
	} else if (username.startsWith('LINE:')) {
		//is a LINE username
		return {
			username: username,
			type: 'line'
		}
	} else {
		parsed_phone = phone(username, options.country)[0];
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

exports.batch_create = function(usernames, options)
{
	options || (options = {});

	return Promise.all((usernames || []).map(function(username) {
		var new_user = exports.parse_username(username);
		new_user.settings = {};
		new_user.created = db.now();

		if (options.force_active)
			new_user.active = true;

		return exports.upsert(new_user);
	}));
};

exports.wipe = function(username)
{
	var user_id;
	return db.one('SELECT id FROM users WHERE username = {{username}}', {username: username})
		.then(function(user) {
			if(!user) throw new Error('that user wasn\'t found');
			if (user.id == config.bot.user_id) throw new Error('can\'t wipe the bot user');

			user_id = user.id;
			var new_username = 'deleted:'+uuid.v4();

			return db.query([
				'UPDATE users ',
				'SET 	username    = {{username}}, ',
				'       first_name 	= NULL, ',
				'		last_name  	= NULL, ',
				'		settings   	= \'{}\', ',
				'		active     	= False ',
				'WHERE  id  	    = {{id}}',
			].join('\n'), {username: new_username, id: user_id});
		})
		.then(function() {
			return db.query([
				'DELETE FROM conversations_recipients ',
				'WHERE user_id = {{id}}'
			].join('\n'), {id: user_id});
		})
		.then(function() {
			return db.query([
				'DELETE FROM messages ',
				'WHERE user_id = {{id}}'
			].join('\n'), {id: user_id});
		});
};

