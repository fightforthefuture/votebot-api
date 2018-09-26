var config = {
	port: process.env.PORT,
	environment: 'production' || 'dev', // used for switching notify endpoints
	//make sure this is unique between deployments that share a Twilio account!

	// the app website for votebot
	app: {
		url: 'http://localhost:3000',
		submit_pdf_url: 'http://localhost:5000/pdf',
		submit_ovr_url: 'http://localhost:5000/ovr',
		admin_password: process.env.ADMIN_PASSWORD,
		force_ssl: false,
		disabled: true
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
		from: 'info@hello.vote',
	},

	// parameters for next election
	election: {
		date: process.env.NEXT_ELECTION_DATE || '2018-11-06',
		ignore_deadlines: true // for when we don't have google civic updates for the next election
	},

	database: {
		ssl: true,
		connstr: process.env.DATABASE_URL,
		max_connections: 8
	},

	bot: {
		user_id: 1,
		advance_delay: 1500, // ms between automatic message sending
							// adjust per twilio recommendation
		advance_delay_fb: 1000
	},

	apixu: {
		key: process.env.APIXU_KEY,
	},

	electionland: {
        api_key: process.env.ELECTIONLAND_API_KEY,
	},

	google_civic: {
		election_id: 5000,
		api_key: process.env.GOOGLE_API_KEY,
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

    slack: {
		verify_token: process.env.SLACK_VERIFY_TOKEN,
		client_secret: process.env.SLACK_CLIENT_SECRET,
		client_id: process.env.SLACK_CLIENT_ID
    },

    line: {
    	api_key: process.env.LINE_API_KEY
    },

    skype: {
    	api_key: process.env.SKYPE_API_KEY,
    	api_secret: process.env.SKYPE_API_SECRET
    },

	session: {
		secret: process.env.SESSION_SECRET
	},

	// send all outgoing SMSs to this number instead of the actual user's number
	// (good for debugging)
	sms_override: null,
};

module.exports = config;