var config = {
	// app-wide logging
	loglevel: 'info',

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
	}
};

module.exports = config;

