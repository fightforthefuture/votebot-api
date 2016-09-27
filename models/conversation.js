var db = require('../lib/db');
var Promise = require('bluebird');
var error = require('../lib/error');
var hasher = require('../lib/hasher');
var message_model = require('./message');
var user_model = require('./user');
var bot_model = require('./bot');
var partners = require('../config.partners');

exports.get = function(id)
{
	return db.one('SELECT * FROM conversations WHERE id = {{id}}', {id: id});
};

exports.create = function(user_id, data)
{
	var recipients = data.recipients || [];
	var message = data.message || {};
	var options = data.options || {};
	var partner = null;
	var valid_data_types = ['sms', 'web', 'fb', 'p2p'];
	// sms means conversation was initiated by text message
	// web means conversation was initiated by web call (from hellovote.org, or other client)
	// fb means conversation was inititated by facebook messenger
	// p2p means conversation was initiated by group chat (not yet implemented)

	if(!data.type || valid_data_types.indexOf(data.type) < 0)
	{
		return Promise.reject(error('Please specify a conversation type '+valid_data_types.join('|'), {code: 400}));
	}
	else if (data.type == 'web' && recipients.length == 0)
	{
		// this is a web only conversation, Web:hash prefix used to init chat over javascript
		recipients.push({username: 'Web:' + hasher.sort_of_unique_id(JSON.stringify(message))});
	}

	if(recipients.length == 0 || !recipients[0].username)
	{
		return Promise.reject(error('Please specify at least one recipient', {code: 400}));
	}

	if (data.partner && typeof partners[data.partner.toLowerCase()] !== 'undefined') {
		console.log('conversation: requested partner: ', data.partner);
		partner = data.partner.toLowerCase();
	}

	var usernames = recipients.map(function(r) { return r.username; }),
		users;

	return user_model.batch_create(usernames, {force_active: options.force_active})
		.then(function(_users) {
			users = _users;

			var conversation = {
				user_id: user_id,
				type: data.type,
				state: data.state || null,
				partner: partner,
				created: db.now()
			};

			return db.create('conversations', conversation);
		})
		.then(function(conversation) {
			var user_ids = users.map(function(u) { return u.id; });
			return exports.set_recipients(conversation.id, user_ids)
				.then(function() {
					if (message.body) {
						return message_model.create(user_id, conversation.id, {body: message.body})
					}
				})
				.then(function(message) {
					var sanitized_users = users.map(function(u) { return { id: u.id, username: u.username }; });

					conversation.messages = [message];
					conversation.users = sanitized_users;

					return conversation;
				})
				.tap(function(conversation) {
					// start bot!
					return bot_model.start(
						'vote_1',
						users[0].id,
						conversation.id,
						{
							start: options.start ? options.start : 'intro',
						}
					);
				});
		});
};

exports.update = function(conversation_id, data)
{
	data.updated = db.now(); // always set the update date
	return db.update('conversations', conversation_id, data);
};

exports.goto_step = function(conversation_id, goto_step)
{
	return exports.get(conversation_id).then(function(conversation) {
		var state = conversation.state;
		state.step = goto_step;
		return exports.update(conversation_id, {state: state});
	});
};

/**
 * wipes and recreates all recipients for a conversation
 */
exports.set_recipients = function(conversation_id, user_ids)
{
	var data = {id: conversation_id};
	return db.query('DELETE FROM conversations_recipients WHERE conversation_id = {{id}}', data)
		.then(function() {
			var records = user_ids.map(function(id) {
				return {conversation_id: conversation_id, user_id: id, created: db.now()};
			});
			return db.create('conversations_recipients', records);
		});
};

/**
 * get the most recent conversation a user has participated in
 */
exports.get_recent_by_user = function(user_id)
{
	var qry = [
		'SELECT',
		'	c.*',
		'FROM',
		'	conversations c,',
		'	conversations_recipients cr',
		'WHERE',
		'	c.id = cr.conversation_id AND',
		'	cr.user_id = {{user_id}}',
		'ORDER BY',
		'	cr.created DESC',
		'LIMIT 1'
	];
	return db.one(qry.join('\n'), {user_id: user_id});
};

// TODO: check user can access conversation
// TODO: use pubsub instead of looping DB
exports.poll = function(user_id, conversation_id, last_id, username, options)
{
	options || (options = {});
	var seconds = options.seconds || 30;

	var start = new Date().getTime();
	var next = function()
	{
		var qry = [
			'SELECT',
			'	m.*',
			'FROM',
			'	messages m',
			'INNER JOIN',
			'	conversations_recipients cr',
			'ON',
			'	cr.conversation_id = m.conversation_id',
			'INNER JOIN',
			'	users u',
			'ON',
			'	u.id = cr.user_id',
			'WHERE',
			'	m.conversation_id = {{convo_id}} AND',
			'	m.id > {{last_id}} AND',
			'	u.username = {{username}}',
			'ORDER BY',
			'	m.created ASC'
		];
		return db.query(qry.join('\n'), {convo_id: conversation_id, last_id: last_id, username: username})
			.then(function(res) {
				if(res.length > 0) return res;
				var now = new Date().getTime();
				if((now - start) > (seconds * 1000)) return [];
				return new Promise(function(resolve, reject) {
					setTimeout(function() {
						resolve(next());
					}, 2000);
				});
			});
	};

	return next();
};

/**
 * end a conversation (set it to inactive)
 */
exports.close = function(conversation_id)
{
	return db.update('conversations', conversation_id, {active: false});
};

