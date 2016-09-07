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
	'create table if not exists chains_steps (id serial primary key, chain_id bigint not null, name varchar(64) not null, msg text not null, no_msg boolean default false, errormsg text not null, next varchar(64) not null, advance boolean default false, final boolean default false, entries int default 0, exits int default 0, admin_order int default 0, admin_special boolean default false, created timestamp);',
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
		msg: '[[msg_intro]]',
		errormsg: '',
		next: 'first_name',
		advance: true,	// this only makes any difference in bot.start!
		admin_order: 0,
	},
	{
		name: 'intro_facebook',
		msg: '[[msg_intro_facebook]]',
		errormsg: '',
		next: 'first_name',
		advance: true,	// this only makes any difference in bot.start!
		admin_order: 1
	},
	{
		name: 'first_name',
		msg: '[[prompt_first_name]]',
		errormsg: '[[error_first_name]]',
		next: 'last_name',
		admin_order: 2,
	},	
	{
		name: 'last_name',
		msg: '[[prompt_last_name]]',
		errormsg: '[[error_last_name]]',
		next: 'zip',
		admin_order: 3,
	},
	{
		name: 'zip',
		msg: '[[prompt_zip]]',
		errormsg: '[[error_zip]]',
		next: 'city',
		admin_order: 4,
	},
	{
		name: 'city',
		msg: '[[prompt_city]]',
		errormsg: '[[error_city]]',
		next: 'state',
		admin_order: 5,
	},
	{
		name: 'state',
		msg: '[[prompt_state]]',
		errormsg: '[[error_state]]', 
		next: 'address', 
		admin_order: 6,
	},
	{
		name: 'address',
		msg: '[[prompt_address]]',
		errormsg: '[[error_address]]',
		next: 'apartment',
		admin_order: 7,
	},
	{
		name: 'apartment',
		msg: '[[prompt_apartment]]',
		errormsg: '[[error_apartment]]',
		next: 'date_of_birth',
		admin_order: 8,
	},
	{
		name: 'date_of_birth',
		msg: '[[prompt_date_of_birth]]',
		errormsg: '[[error_date_of_birth]]',
		next: 'will_be_18',
		admin_order: 9, 
	},
	{
		name: 'will_be_18',
		msg: '[[prompt_will_be_18]]',
		errormsg: '',
		next: 'email',
		admin_special: true,
		admin_order: 10,
	},
	{
		name: 'email',
		msg: '',	// actual email prompt is sent in pre_process
		no_msg: true,
		errormsg: '[[error_email]]',
		next: 'per_state',
		admin_order: 11,
	},
	{
		name: 'per_state',
		msg: 'THIS IS THE STEP THAT ASKS ALL THE PER-STATE QUESTIONS.',
		errormsg: '',
		next: 'confirm_name_address',
		admin_special: true,
		admin_order: 12,
	},
	{
		name: 'ovr_disclosure',
		msg: '',
		errormsg: '',
		next: '',
		no_msg: true,
		admin_special: true,
		admin_order: 13
	},
	{
		name: 'ovr_disclosure',
		msg: '',
		no_msg: true,
		errormsg: '',
		next: '',
		admin_special: true,
		admin_order: 14,
	},
	{
		name: 'confirm_ovr_disclosure',
		msg: '',
		no_msg: true,
		errormsg: '',
		next: '',
		admin_special: true,
		admin_order: 15
	},
	{
		name: 'confirm_name_address',
		msg: '[[prompt_confirm_name_address]]',
		errormsg: '[[error_confirm_name_address]]',
		next: 'submit',
		advance: false,
		admin_order: 16,
	},
	{
		name: 'submit',
		msg: '', // don't send message here, it will echo to user
		errormsg: '',
		next: 'complete',
		admin_special: true,
		admin_order: 17,
	},
	{
		name: 'processing',
		next: 'processing',
		msg: '[[msg_processing]]',
		errormsg: '',
		admin_special: true,
		admin_order: 18

	},
	{
		name: 'processed',
		next: 'complete',
		advance: false,
		errormsg: '',
		msg: '',
		no_msg: true,
		admin_special: true,
		admin_order: 19
	},
	{
		name: 'complete',
		msg: '[[msg_complete]]',
		errormsg: '',
		next: 'share', 
		advance: false,
		admin_order: 20,
	},
	{
		name: 'incomplete',
		msg: '[[prompt_incomplete]]',
		errormsg: '',
		next: 'restart', 
		admin_special: true,
		admin_order: 21,
	},
	{
		name: 'share',
		msg: '',
		no_msg: true,
		errormsg: '',
		next: 'fftf_opt_in',
		advance: false,
		admin_order: 22,
	},
	{
		name: 'restart',
		msg: '[[prompt_restart]]',
		errormsg: '',
		next: 'intro',
		admin_special: true,
		admin_order: 23,
	},
	{
		name: 'us_citizen',
		msg: '[[prompt_us_citizen]]',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 24,
	},
	{
		name: 'legal_resident',
		msg: '[[prompt_legal_resident]]',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 25,
	},
	{
		name: 'military_or_overseas',
		msg: '[[prompt_military_or_overseas]]',
		errormsg: '[[error_military_or_overseas]]',
		next: 'per_state',
		admin_special: true,
		admin_order: 26,
	},
	{
		name: 'ethnicity',
		msg: '[[prompt_ethnicity]]',
		errormsg: '[[error_ethnicity]]',
		next: 'per_state',
		admin_special: true,
		admin_order: 27,
	},
	{
		name: 'political_party',
		msg: '[[prompt_political_party]]',
		errormsg: '[[error_political_party]]',
		next: 'per_state',
		admin_special: true,
		admin_order: 28,
	},
	{
		name: 'disenfranchised',
		msg: '[[prompt_disenfranchised]]',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 29,
	},
	{
		name: 'disqualified',
		msg: '[[prompt_disqualified]]',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 30,
	},
	{
		name: 'incompetent',
		msg: '[[prompt_incompetent]]',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 31,
	},
	{
		name: 'phone',
		msg: '[[prompt_phone]]',
		errormsg: '[[error_phone]]',
		next: 'per_state', 
		admin_special: true,
		admin_order: 32,
	},
	{
		name: 'state_id_number',
		msg: '[[prompt_state_id_number]]',
		errormsg: '[[error_state_id_number]]',
		next: 'per_state',
		admin_special: true,
		admin_order: 33,
	},
	{
		name: 'state_id_issue_date',
		msg: '[[prompt_state_id_issue_date]]',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 34,
	},
	{
		name: 'ssn',
		msg: '[[prompt_ssn]]',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 35,
	},
	{
		name: 'ssn_last4',
		msg: '[[prompt_ssn_last4]]',
		errormsg: '[[error_ssn_last4]]',
		next: 'per_state',
		admin_special: true,
		admin_order: 36,
	},
	{
		name: 'state_id_or_ssn_last4',
		msg: '[[prompt_state_id_or_ssn_last4]]',
		errormsg: '[[error_state_id_or_ssn_last4]]',
		next: 'per_state',
		admin_special: true,
		admin_order: 37,
	},
	{
		name: 'gender',
		msg: '[[prompt_gender]]',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 38,
	},
	{
		name: 'county',
		msg: '[[prompt_county]]',
		errormsg: '[[error_county]]',
		next: 'per_state',
		admin_special: true,
		admin_order: 39,
	},
	{
		name: 'consent_use_signature',
		msg: '[[prompt_consent_use_signature]]',
		errormsg: '[[error_consent_use_signature]]',
		next: 'per_state',
		admin_special: true,
		admin_order: 40,
	},
	{
		name: 'vote_by_mail',
		msg: '[[prompt_vote_by_mail]]',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 41,
	},
	{
		name: 'has_previous_address',
		msg: '[[prompt_has_previous_address]]',
		errormsg: '',
		next: '',
		admin_special: true,
		admin_order: 42
	},
	{
		name: 'previous_address',
		msg: '[[prompt_previous_address]]',
		next: 'per_state',
		errormsg: '',
		admin_special: true,
		admin_order: 43
	},
	{
		name: 'has_previous_name',
		msg: '[[prompt_has_previous_name]]',
		errormsg: '',
		next: '',
		admin_special: true,
		admin_order: 44
	},
	{
		name: 'previous_name',
		msg: '[[prompt_previous_name]]',
		next: 'per_state',
		errormsg: '',
		admin_special: true,
		admin_order: 45
	},
	{
		name: 'has_separate_mailing_address',
		msg: '[[prompt_has_separate_mailing_address]]',
		errormsg: '',
		next: '',
		admin_special: true,
		admin_order: 46
	},
	{
		name: 'separate_mailing_address',
		msg: '[[prompt_separate_mailing_address]]',
		next: 'per_state',
		errormsg: '',
		admin_special: true,
		admin_order: 47
	},
	{
		name: 'change_state',
		msg: '[[prompt_change_state]]',
		next: 'per_state',
		errormsg: '',
		admin_special: true,
		admin_order: 48
	},
	{
		name: 'fftf_opt_in',
		msg: '[[prompt_fftf_opt_in]]',
		errormsg: '',
		next: 'fftf_opt_in_thanks',
		admin_order: 49,
	},
	{
		name: 'fftf_opt_in_thanks',
		msg: '[[msg_fftf_opt_in_thanks]]',
		errormsg: '',
		next: '(final)',
		final: true,
		admin_order: 50,
	},
	{
		name: 'ineligible',
		msg: '[[prompt_ineligible]]',
		errormsg: '',
		next: 'restart', 
		admin_special: true,
		admin_order: 51,
	},
	
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

