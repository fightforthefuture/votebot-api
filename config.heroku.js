var config = {
	environment: 'hellovote-production',
	port: process.env.PORT,

	// the app website for votebot
	app: {
		url: 'https://votebot-api.herokuapp.com',
		submit_pdf_url: 'https://votebot-forms.herokuapp.com/pdf',
		submit_ovr_url: 'https://votebot-forms.herokuapp.com/ovr',
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
		user_id: 1,
		advance_delay: 2000 // ms between automatic message sending
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

    facebook: {
		verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
		access_token: process.env.FACEBOOK_ACCESS_TOKEN
    },

	session: {
		secret: process.env.SESSION_SECRET
	},

	// send all outgoing SMSs to this number instead of the actual user's number
	// (good for debugging)
	sms_override: null,
};

module.exports = config;

