var config = {
	// app-wide logging
	loglevel: 'info',
	port: 80,

	// the app website for votebot
	app: {
		url: 'http://voteymcbotface.com'
	},

	// sends detailed error information back with failed requests
	//
	// true when developing, false in prod
	error_responses: true,

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

