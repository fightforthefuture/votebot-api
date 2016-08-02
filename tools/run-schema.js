var db = require('../lib/db');
var config = require('../config');
var Promise = require('bluebird');
var user_model = require('../models/user');

var bot_number = user_model.parse_username(config.twilio.from_number);
var schema = [
	// create user types
	// 'CREATE TYPE user_type AS ENUM (\'sms\', \'facebook-messenger\');',

	// start with tables
	'create table if not exists users (id serial primary key, username varchar(64) not null, type varchar(64), first_name varchar(255), last_name varchar(255), settings json, active boolean default true, submit boolean default false, created timestamp);',
	'create table if not exists conversations (id serial primary key, user_id bigint not null, type varchar(64), state json, active boolean default true, created timestamp);',
	'create table if not exists conversations_recipients (id serial primary key, conversation_id bigint not null, user_id bigint not null, created timestamp);',
	'create table if not exists messages (id serial primary key, user_id bigint not null, conversation_id bigint not null, body varchar(255), created timestamp);',
	'create table if not exists chains (id serial primary key, name varchar(64) not null, description text, default_start varchar(64) not null default \'intro_direct\', entries int default 0, exits int default 0, created timestamp);',
	'create table if not exists chains_steps (id serial primary key, chain_id bigint not null, name varchar(64) not null, msg text not null, errormsg text not null, next varchar(64) not null, advance boolean default false, final boolean default false, entries int default 0, exits int default 0, admin_order int default 0, admin_special boolean default false, created timestamp);',

	// index our tables
	'create unique index if not exists users_username on users (username);',
	'create index if not exists messages_conversation_id on messages (conversation_id);',
	'create index if not exists conversations_recipients_userconv on conversations_recipients (user_id, conversation_id);',
	'create index if not exists conversations_recipients_convuser on conversations_recipients (conversation_id, user_id);',
	'create unique index if not exists chains_name on chains (name);',
	'create index if not exists chains_steps_chain on chains_steps (chain_id, admin_order);',

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
		msg: "\u{1F64B} This is HelloVote! I\'m going to help you register to vote. I\'ll ask a few questions so I can fill out your form. Your answers are encrypted for privacy. \u{1F510}",
		errormsg: '',
		advance: true,
		next: 'first_name',
		admin_order: 0,
	},
	{
		name: 'first_name',
		msg: 'So, what’s your first name? (This is an official state form \u{1F4C4}, so we need your official information.)',
		errormsg: 'Please enter your first name',
		next: 'last_name',
		admin_order: 1,
	},	
	{
		name: 'last_name',
		msg: 'Ok {{first_name}}, what\'s your last name? Again, this needs to be your official information.',
		errormsg: 'Please enter your last name',
		next: 'zip',
		admin_order: 2,
	},
	{
		name: 'zip',
		msg: 'Got it. Now, what\'s your zip code?',
		errormsg: 'Please enter your five-digit zip code, or SKIP if you don\'t know it.',
		next: 'city',
		admin_order: 3,
	},
	{
		name: 'city',
		msg: 'What city do you live in?',
		errormsg: 'Please enter your city',
		next: 'state',
		admin_order: 4,
	},
	{
		name: 'state',
		msg: 'What state do you live in? (eg CA)',
		errormsg: 'Please enter your state', 
		next: 'address', 
		admin_order: 5,
	},
	{
		name: 'address',
		msg: 'What\'s your street address in {{settings.city}}, {{settings.state}}?',
		errormsg: 'Please enter just your street address',
		next: 'apartment',
		admin_order: 6,
	},
	{
		name: 'apartment',
		msg: 'Is there an apartment number? If not, say “no”. Otherwise, say the number!',
		errormsg: 'Please enter an apartment number',
		next: 'date_of_birth',
		admin_order: 7,
	},
	{
		name: 'date_of_birth',
		msg: 'What day were you born? \u{1F4C5} (month/day/year)',
		errormsg: 'Please enter your date of birth as month/day/year',
		next: 'email',
		admin_order: 8, 
	},
	{
		name: 'email',
		msg: 'What\'s your email address?',
		errormsg: 'Please enter your email address. If you don\'t have one, reply SKIP',
		next: 'per_state',
		admin_order: 9,
	},
	{
		name: 'per_state',
		msg: 'THIS IS THE STEP THAT ASKS ALL THE PER-STATE QUESTIONS.',
		errormsg: '',
		next: 'submit',
		admin_special: true,
		admin_order: 9,
	},
	{
		name: 'submit',
		msg: 'THIS IS THE STEP THAT SUBMITS TO THE FORM STUFFER.',
		errormsg: '',
		next: 'complete',
		admin_special: true,
		admin_order: 10,
	},
	{
		name: 'complete',
		msg: 'We are processing your registration! Check your email for further instructions.',
		errormsg: '',
		next: 'share', 
		advance: true,
		admin_order: 11,
	},
	{
		name: 'incomplete',
		msg: 'Sorry, your registration is incomplete. (fix/restart)?',
		errormsg: '',
		next: 'restart', 
		admin_special: true,
		admin_order: 12,
	},
	{
		name: 'share',
		msg: 'Thanks for registering with HelloVote! Share with your friends to get them registered too: http://hellovote.org/share?u=ASDF',
		errormsg: '',
		next: '(final)',
		final: true,
		admin_order: 13,
	},
	{
		name: 'restart',
		msg: 'This will restart your HelloVote registration! Reply (ok) to continue.',
		errormsg: '',
		next: 'intro',
		admin_special: true,
		admin_order: 14,
	},
	{
		name: 'us_citizen',
		msg: 'Are you a US citizen? (yes/no)',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 15,
	},
	{
		name: 'legal_resident',
		msg: 'Are you a current legal resident of {{settings.state}}? (yes/no)',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 16,
	},
	{
		name: 'will_be_18',
		msg: 'Are you 18 or older, or will you be by the date of the election? (yes/no)',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 17,
	},
	{
		name: 'ethnicity',
		msg: 'What is your ethnicity or race? (asian-pacific/black/hispanic/native-american/white/multi-racial/other)',
		errormsg: 'Please let us know your ethnicity or race.',
		next: 'per_state',
		admin_special: true,
		admin_order: 18,
	},
	{
		name: 'party',
		msg: 'What\'s your party preference? (democrat/republican/libertarian/green/other/none)',
		errormsg: 'Please let us know your party preference',
		next: 'per_state',
		admin_special: true,
		admin_order: 19,
	},
	{
		name: 'disenfranchised',
		msg: 'Are you currently disenfranchised from voting (for instance due to a felony conviction)? (yes/no)',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 20,
	},
	{
		name: 'incompetent',
		msg: 'Have you been found legally incompetent in your state? (yes/no)',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 21,
	},
	{
		name: 'state_id',
		msg: 'What\'s your {{settings.state}} driver\'s license (or state ID) number?',
		errormsg: 'Please enter your state ID number',
		next: 'per_state',
		admin_special: true,
		admin_order: 22,
	},
	{
		name: 'state_id_issue_date',
		msg: 'What date was your state id/driver\'s license issued? (mm/dd/yyyy)',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 23,
	},
	{
		name: 'ssn',
		msg: 'Alright, last thing - in order to finish your registration, your state wants to know your SSN. (We don\'t store this info either!)',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 24,
	},
	{
		name: 'ssn_last4',
		msg: 'Alright, last thing - in order to finish your registration, your state wants to know the last 4 of your SSN. (We don\'t store this info either!)',
		errormsg: 'Please enter the last 4 digits of your SSN.',
		next: 'per_state',
		admin_special: true,
		admin_order: 25,
	},
	{
		name: 'state_id_or_ssn_last4',
		msg: 'What\'s your {{settings.state}} ID number? If you don\'t have one, enter the last 4 digits of your SSN. Your info is safe with us.',
		errormsg: 'Please enter your state ID number or last 4 of your SSN',
		next: 'per_state',
		admin_special: true,
		admin_order: 26,
	},
	{
		name: 'gender',
		msg: 'What\'s your gender?',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 27,
	},
	{
		name: 'county',
		msg: 'What county do you reside in?',
		errormsg: 'Please enter the name of the county you reside in',
		next: 'per_state',
		admin_special: true,
		admin_order: 28,
	},
	{
		name: 'consent_use_signature',
		msg: 'May we use your signature on file with the DMV to complete the form with your state? (yes/no)',
		errormsg: 'Please reply YES to let us request your signature from the DMV. We do not store this information.',
		next: 'per_state',
		admin_special: true,
		admin_order: 29,
	},
	{
		name: 'mail_in',
		msg: 'Would you like to vote by mail-in ballot?',
		errormsg: '',
		next: 'per_state',
		admin_special: true,
		admin_order: 30,
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

