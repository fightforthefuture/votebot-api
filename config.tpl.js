var config = {
	// app-wide logging
	loglevel: 'info',

	// the app website for votebot
	app: {
		url: 'http://voteymcbotface.com',
		admin_password: process.env.ADMIN_PASSWORD
	},

	// sends detailed error information back with failed requests
	//
	// true when developing, false in prod
	error_responses: true,

	// parameters for next election
	election: {
		date: '11/08/2016',
	},

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
	sms_override: null,

	// url to submit to votebot-forms
	submit_url: 'http://localhost:5000/registration'
};

module.exports = config;

