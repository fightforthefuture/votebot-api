require('newrelic');

var config = {
	environment: process.env.APP_ENVIRONMENT,
	port: process.env.PORT,

	// the app website for votebot
	app: {
		url: process.env.URL,
		submit_pdf_url: process.env.SUBMIT_PDF_URL,
		submit_ovr_url: process.env.SUBMIT_OVR_URL,
		admin_password: process.env.ADMIN_PASSWORD,
		force_ssl: process.env.FORCE_SSL ? true : false,
        disabled: false
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
		from: process.env.MAIL_FROM_ADDRESS,
	},

	// parameters for next election
	election: {
		date: process.env.NEXT_ELECTION_DATE || '2018-11-06',
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
        election_id: 4271,
        api_key: process.env.GOOGLE_API_KEY,
    },

    smarty_streets: {
        auth_id: process.env.SMARTY_STREETS_ID,
        auth_token: process.env.SMARTY_STREETS_TOKEN,
    },

    target_smart: {
    	api_key: process.env.TARGET_SMART_KEY,
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

    votebot_api_key: process.env.VOTEBOT_API_KEY,

	session: {
		secret: process.env.SESSION_SECRET
	},

	// send all outgoing SMSs to this number instead of the actual user's number
	// (good for debugging)
	sms_override: null,
};

module.exports = config;

