var config = {
	// app-wide logging
	loglevel: 'info',
	port: process.env.PORT,

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
		date: process.env.NEXT_ELECTION_DATE || '11/08/2016',
	},

	database: {
		ssl: true,
		connstr: process.env.DATABASE_URL,
		max_connections: 8
	},

	bot: {
		user_id: 1
	},

	twilio: {
		account_sid: process.env.TWILIO_SID,
		auth_token: process.env.TWILIO_AUTH_TOKEN,
		from_number: process.env.TWILIO_FROM_NUMBER
	},

	// send all outgoing SMSs to this number instead of the actual user's number
	// (good for debugging)
	sms_override: null
};

module.exports = config;

