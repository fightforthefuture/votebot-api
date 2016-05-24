var config = {
	// app-wide logging
	loglevel: 'info',

	// the app website for votebot
	app: {
		url: 'http://voteymcbotface.com'
	},

	// sends detailed error information back with failed requests
	//
	// true when developing, false in prod
	error_responses: true,

	database: {
		server: 'localhost',
		port: 5432,
		database: 'mydbname',
		user: 'postgres',
		password: 'passwordlolol',
		max_connections: 8
	},

	bot: {
		user_id: 1
	},

	twilio: {
		account_sid: '<SID>',
		auth_token: '<TOKEN>',
		from_number: '+183155512345'
	},

	// send all outgoing SMSs to this number instead of the actual user's number
	// (good for debugging)
	sms_override: null
};

module.exports = config;

