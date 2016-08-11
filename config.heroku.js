var config = {
	environment: 'hellovote-production',
	port: process.env.PORT,

	// the app website for votebot
	app: {
		url: 'https://votebot-api.herokuapp.com',
		submit_url: 'https://votebot-forms.herokuapp.com/registration',
		admin_password: process.env.ADMIN_PASSWORD,
		force_ssl: true
	},

	// app-wide logging
	logging: {
		level: process.env.LOGLEVEL || 'error',
		sentry: process.env.SENTRY_DSN,
		validation_errors: 'postgres', // secure connections also require env[PGSSLMODE]=require
		// sends detailed error information back with failed requests
		// true when developing, false in prod
		error_responses: false,
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
		user_id: 1,
		advance_delay: 1000 // ms between automatic message sending
							// adjust per twilio recommendation
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

