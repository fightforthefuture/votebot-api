var db = require('../lib/db');
var config = require('../config');
var Promise = require('bluebird');
var user_model = require('../models/user');

var bot_number = user_model.parsenum(config.twilio.from_number);
var schema = [
	// start with tables
	'create table if not exists users (id serial primary key, username varchar(64) not null, fullname varchar(255), settings json, active boolean default true, created timestamp);',
	'create table if not exists conversations (id serial primary key, user_id bigint not null, type varchar(64), state json, active boolean default true, created timestamp);',
	'create table if not exists conversations_recipients (id serial primary key, conversation_id bigint not null, user_id bigint not null, created timestamp);',
	'create table if not exists messages (id serial primary key, user_id bigint not null, conversation_id bigint not null, body varchar(255), created timestamp);',

	// index our tables
	'create unique index if not exists users_username on users (username);',
	'create index if not exists messages_conversation_id on messages (conversation_id);',
	'create index if not exists conversations_recipients_userconv on conversations_recipients (user_id, conversation_id);',
	'create index if not exists conversations_recipients_convuser on conversations_recipients (conversation_id, user_id);',

	// create our first user (VoterBot) and set our auto-inc user id
	'insert into users (id, username, fullname, created) values ('+config.bot.user_id+', \''+bot_number+'\', \'VoterBot\', now()) on conflict (id) do update set username = \''+bot_number+'\'',
	'select setval(\'users_id_seq\', max(id)) from users'
];

function run()
{
	console.log('- running DB schema');
	return Promise.each(schema, function(qry) { return db.query(qry); })
		.then(function() { console.log('- done'); })
		.catch(function(err) { console.error(err, err.stack); })
		.finally(function() { setTimeout(process.exit, 100); });
}

run();

