var db = require('../lib/db');
var config = require('../config');
var Promise = require('bluebird');
var user_model = require('../models/user');
var l10n = require('../lib/l10n');

var bot_number = user_model.parse_username(config.twilio.from_number);
var schema = [
	// create user types
	// 'CREATE TYPE user_type AS ENUM (\'sms\', \'facebook-messenger\');',

	// start with tables
	'create table if not exists users (id serial primary key, username varchar(64) not null, type varchar(64), first_name varchar(255), last_name varchar(255), settings json, active boolean default true, submit boolean default false, complete boolean default false, created timestamp);',
	'create table if not exists conversations (id serial primary key, user_id bigint not null, type varchar(64), locale varchar(64) not null default \'en\', state json, active boolean default true, created timestamp);',
	'create table if not exists conversations_recipients (id serial primary key, conversation_id bigint not null, user_id bigint not null, created timestamp);',
	'create table if not exists messages (id serial primary key, user_id bigint not null, conversation_id bigint not null, body varchar(1600), created timestamp);',
	'create table if not exists chains (id serial primary key, name varchar(64) not null, description text, default_start varchar(64) not null default \'intro_direct\', entries int default 0, exits int default 0, created timestamp);',
	'create table if not exists chains_steps (id serial primary key, chain_id bigint not null, name varchar(64) not null, msg text not null, errormsg text not null, next varchar(64) not null, advance boolean default false, final boolean default false, entries int default 0, exits int default 0, admin_order int default 0, admin_special boolean default false, created timestamp);',
	'create table if not exists validation_errors (ts timestamp default current_timestamp, level varchar, msg varchar, meta jsonb);',
	'create table if not exists submissions (id serial primary key, user_id bigint not null, conversation_id bigint not null, form_stuffer_reference varchar(255), form_stuffer_response json, form_stuffer_log_id bigint, status varchar(64) not null default \'pending\', created timestamp, ended timestamp);',

	// index our tables
	'create unique index if not exists users_username on users (username);',
	'create index if not exists messages_conversation_id on messages (conversation_id);',
	'create index if not exists conversations_recipients_userconv on conversations_recipients (user_id, conversation_id);',
	'create index if not exists conversations_recipients_convuser on conversations_recipients (conversation_id, user_id);',
	'create unique index if not exists chains_name on chains (name);',
	'create index if not exists chains_steps_chain on chains_steps (chain_id, admin_order);',
	'create index if not exists submissions_user_id on submissions (user_id);',
	'create index if not exists submissions_conversation_id on submissions (conversation_id);',
	'create index if not exists submissions_status on submissions (status);',
	'create index if not exists submissions_created on submissions (created desc);',
	'create index if not exists submissions_form_stuffer_reference on submissions (form_stuffer_reference);',
	'create index if not exists submissions_form_stuffer_log_id on submissions (form_stuffer_log_id);',
	'create index if not exists validation_errors_meta_user_id on validation_errors ((meta->>\'user_id\'));',
	'create index if not exists validation_errors_ts on validation_errors (ts desc);',

	// create our first user (VoteBot) and set our auto-inc user id
	'insert into users (id, username, type, first_name, last_name, created) values ('+config.bot.user_id+', \''+bot_number+'\', \'sms\', \'VoteBot\', \'\', now()) on conflict (id) do update set username = \''+bot_number+'\'',
	'select setval(\'users_id_seq\', max(id)) from users'
];

var default_chain = {
	name: 'vote_1',
	description: 'The default chain created by the VoteBot app',
	default_start: 'intro',
	entries: 0,
	exits: 0,
	created: db.now()
	};

var default_chain_steps = [
	{
		name: 'intro',
		msg: l10n('msg_intro'),
		errormsg: '',
		next: 'first_name',
		advance: true,
		admin_order: 0,
	},
	{
		name: 'first_name',
		msg: l10n('prompt_first_name'),
		errormsg: l10n('error_first_name'),
		next: 'last_name',
		admin_order: 1,
	},	
	{
		name: 'last_name',
		msg: l10n('prompt_last_name'),
		errormsg: l10n('error_last_name'),
		next: 'zip',
		admin_order: 2,
	},
	{
		name: 'zip',
		msg: l10n('prompt_zip'),
		errormsg: l10n('error_zip'),
		next: 'city',
		admin_order: 3,
	},
	{
		name: 'city',
		msg: l10n('prompt_city'),
		errormsg: l10n('error_city'),
		next: 'state',
		admin_order: 4,
	},
	{
		name: 'state',
		msg: l10n('prompt_state'),
		errormsg: l10n('error_state'), 
		next: 'address', 
		admin_order: 5,
	},
	{
		name: 'address',
		msg: l10n('prompt_address'),
		errormsg: l10n('error_address'),
		next: 'apartment',
		admin_order: 6,
	},
	{
		name: 'apartment',
		msg: l10n('prompt_apartment'),
		errormsg: l10n('error_apartment'),
		next: 'date_of_birth',
		admin_order: 7,
	},
	{
		name: 'date_of_birth',
		msg: l10n('prompt_date_of_birth'),
		errormsg: l10n('error_date_of_birth'),
		next: 'will_be_18',
		admin_order: 8, 
	},
	{
		name: 'will_be_18',
		msg: l10n('prompt_will_be_18'),
		errormsg: '',
		next: 'email',
		admin_special: true,
		admin_order: 9,
	},
	{
		name: 'email',
		msg: l10n('prompt_email'),
		// actual email prompt is sent in pre_process
		errormsg: l10n('error_email'),
		next: 'per_state',
		admin_order: 10,
	},
	{
		name: 'per_state',
		msg: 'THIS IS THE STEP THAT ASKS ALL THE PER-STATE QUESTIONS.',
		errormsg: '',
		next: 'confirm_name_address',
		admin_special: true,
		admin_order: 11,
	},
	{
		name: 'confirm_name_address',
		msg: l10n('prompt_confirm_name_address'),
		errormsg: l10n('error_confirm_name_address'),
		next: 'submit',
		advance: true,
		admin_order: 12,
	},
	{
		name: 'submit',
		msg: '', // don't send message here, it will echo to user
		errormsg: '',
		next: 'complete',
		admin_special: true,
		admin_order: 13,
	},
	{
		name: 'complete',
		msg: l10n('msg_complete'),
		errormsg: '',
		next: 'share', 
		advance: true,
		admin_order: 14,
	},
	{
		name: 'incomplete',
		msg: l10n('prompt_incomplete'),
		errormsg: '',
		next: 'restart', 
		admin_special: true,
		admin_order: 15,
	},
	{
		name: 'share',
		msg: l10n('msg_share'),
		errormsg: '',
		next: 'fftf_opt_in',
		advance: true,
		admin_order: 16,
	},
	{
		name: 'restart',
		msg: l10n('prompt_restart'),
		errormsg: '',
		next: 'intro',
		admin_special: true,
		admin_order: 17,
	},
	{
		name: 'us_citizen',
		msg: l10n('prompt_us_citizen'),
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 18,
	},
	{
		name: 'legal_resident',
		msg: l10n('prompt_legal_resident'),
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 19,
	},
	{
		name: 'military_or_overseas',
		msg: l10n('prompt_military_or_overseas'),
		errormsg: l10n('error_military_or_overseas'),
		next: 'per_state',
		admin_special: true,
		admin_order: 20,
	},
	{
		name: 'ethnicity',
		msg: l10n('prompt_ethnicity'),
		errormsg: l10n('error_ethnicity'),
		next: 'per_state',
		admin_special: true,
		admin_order: 21,
	},
	{
		name: 'political_party',
		msg: l10n('prompt_political_party'),
		errormsg: l10n('error_political_party'),
		next: 'per_state',
		admin_special: true,
		admin_order: 22,
	},
	{
		name: 'disenfranchised',
		msg: l10n('prompt_disenfranchised'),
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 23,
	},
	{
		name: 'disqualified',
		msg: l10n('prompt_disqualified'),
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 24,
	},
	{
		name: 'incompetent',
		msg: l10n('prompt_incompetent'),
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 25,
	},
	{
		name: 'phone',
		msg: l10n('prompt_phone'),
		errormsg: l10n('error_phone'),
		next: 'per_state', 
		admin_special: true,
		admin_order: 26,
	},
	{
		name: 'state_id_number',
		msg: l10n('prompt_state_id_number'),
		errormsg: l10n('error_state_id_number'),
		next: 'per_state',
		admin_special: true,
		admin_order: 27,
	},
	{
		name: 'state_id_issue_date',
		msg: l10n('prompt_state_id_issue_date'),
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 28,
	},
	{
		name: 'ssn',
		msg: l10n('prompt_ssn'),
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 29,
	},
	{
		name: 'ssn_last4',
		msg: l10n('prompt_ssn_last4'),
		errormsg: l10n('error_ssn_last4'),
		next: 'per_state',
		admin_special: true,
		admin_order: 30,
	},
	{
		name: 'state_id_or_ssn_last4',
		msg: l10n('prompt_state_id_or_ssn_last4'),
		errormsg: l10n('error_state_id_or_ssn_last4'),
		next: 'per_state',
		admin_special: true,
		admin_order: 31,
	},
	{
		name: 'gender',
		msg: l10n('prompt_gender'),
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 32,
	},
	{
		name: 'county',
		msg: l10n('prompt_county'),
		errormsg: l10n('error_county'),
		next: 'per_state',
		admin_special: true,
		admin_order: 33,
	},
	{
		name: 'consent_use_signature',
		msg: l10n('prompt_consent_use_signature'),
		errormsg: l10n('error_consent_use_signature'),
		next: 'per_state',
		admin_special: true,
		admin_order: 34,
	},
	{
		name: 'vote_by_mail',
		msg: l10n('prompt_vote_by_mail'),
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 35,
	},
	{
		name: 'fftf_opt_in',
		msg: l10n('prompt_fftf_opt_in'),
		errormsg: '',
		next: 'fftf_opt_in_thanks',
		admin_order: 36,
	},
	{
		name: 'fftf_opt_in_thanks',
		msg: l10n('msg_fftf_opt_in_thanks'),
		errormsg: '',
		next: '(final)',
		final: true,
		admin_order: 37,
	},
	{
		name: 'ineligible',
		msg: l10n('prompt_ineligible'),
		errormsg: '',
		next: 'restart', 
		admin_special: true,
		admin_order: 38,
	}
];

function run()
{
	console.log('- running DB schema');
	return Promise.each(schema, function(qry) { return db.query(qry); })
		.then(function() {
			console.log('- checking if our default chain exists in DB lol');
			return db.query('SELECT id FROM chains WHERE name=\''+ default_chain['name'] +'\';');
		})
		.then(function(result) {
			if (result.length) {
				console.log('- default chain exists! nothing more to do lol');
				return;
			}
			console.log('- default chain DOES NOT exist. creating...');

			return db.create('chains', default_chain).then(function(chain) {
				console.log('- created default chain: ', chain.id);

				return Promise.each(default_chain_steps, function(step) {
					step.created = db.now();
					step.chain_id = chain.id;

					console.log('  - inserting step: ', step.name);

					return db.create('chains_steps', step);
				});
			});
		})
		.catch(function(err) { console.error(err, err.stack); })
		.finally(function() { setTimeout(process.exit, 100); });
}

run();

