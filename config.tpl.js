var config = {
	port: process.env.PORT,
	environment: 'production' || 'dev', // used for switching notify endpoints
	//make sure this is unique between deployments that share a Twilio account!

	// the app website for votebot
	app: {
		url: 'http://localhost:3000',
		submit_url: 'http://localhost:5000', // votebot-forms running on flask
		admin_password: process.env.ADMIN_PASSWORD,
		force_ssl: false
	},

	// app-wide logging
	logging: {
		level: process.env.LOGLEVEL || 'error',
		sentry: process.env.SENTRY_DSN,

		// sends detailed error information back with failed requests
		// true when developing, false in prod
		error_responses: false,
	},

	mail: {
		smtp: {
		    host: 'localhost',
		    port: 1025, // python -m smtpd -n -c DebuggingServer localhost:1025
		},
		from: 'info@hellovote.org',
	},

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

	smarty_streets: {
        auth_id: process.env.SMARTY_STREETS_ID,
        auth_token: process.env.SMARTY_STREETS_TOKEN,
    },

	twilio: {
		account_sid: process.env.TWILIO_SID,
		auth_token: process.env.TWILIO_AUTH_TOKEN,
		from_number: process.env.TWILIO_FROM_NUMBER,
		messaging_sid: process.env.TWILIO_MESSAGING_SID,
		notify_sid: process.env.TWILIO_NOTIFY_SID,
		facebook_page_id: process.env.FACEBOOK_PAGE_ID,
	},

	session: {
		secret: process.env.SESSION_SECRET
	},

	// send all outgoing SMSs to this number instead of the actual user's number
	// (good for debugging)
	sms_override: null,
};

module.exports = config;