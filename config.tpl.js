var config = {
	port: process.env.PORT,
	environment: 'production' || 'dev', // used for switching notify endpoints
	//make sure this is unique between deployments that share a Twilio account!

	// the app website for votebot
	app: {
		url: 'http://localhost:3000',
		submit_vote_dot_org_url: 'http://localhost:5000/vote_dot_org',
		submit_ovr_url: 'http://localhost:5000/ovr',
		admin_password: process.env.ADMIN_PASSWORD,
		force_ssl: false
	},

	// app-wide logging
	logging: {
		level: process.env.LOGLEVEL || 'error',
		sentry: process.env.SENTRY_DSN,
		validation_errors: 'postgres',
		// sends detailed error information back with failed requests
		// true when developing, false in prod
		error_responses: false,
	},

	mail: {

		sparkpost: {
			api_key: process.env.SPARKPOST_API_KEY
		},
		from: 'info@hellovote.org',
	},

	// parameters for next election
	election: {
		date: process.env.NEXT_ELECTION_DATE || '2016-08-11',
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

	facebook: {
		verify_token: 'something secret',
		access_token: 'your facebook page access token lol'
    },

	session: {
		secret: process.env.SESSION_SECRET
	},

	// send all outgoing SMSs to this number instead of the actual user's number
	// (good for debugging)
	sms_override: null,
};

module.exports = config;