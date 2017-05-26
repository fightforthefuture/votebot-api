# Votebot API

### Voter Registration Chatbot for Everyone

Votebot is an SMS chatbot that uses text messages to guide users through a
conversation and register them to vote. Text messages are sent and received
using [Twilio API][1]. This works in tandem with the [Votebot-Forms][2] project
to submit registration data to the Secretary of State in states that support
online voter registration (OVR).

For states that do not support OVR, Votebot-Forms generates a pre-filled
National Mail Voter Registration PDF[3] that the user can then sign and
mail to their Secretary of State. Optionally, a postage-paid return envelope
can be mailed to the users, so they don't have to deal with printing or postage.


## Service dependencies

* **[Node.js 4.4+][4]**
* **[npm][5]**
* **[Postgresql 9.5+][6]**
* **[Twilio API][1]**
* **[a running Votebot-Forms instance][2]**


## Installation and Setup


### Install the dependencies

Just cd to whatever directory you installed the code into and run `npm install`.


### Configure the environment variables

All settings for Votebot are specified via environment variables. There's
a template file with these variables stored in `env.sample`. Copy these into a
file called `.env` (important to use that filename since it's in the
`.gitignore` and you don't want to commit any of these private values into the
repo). Then, edit the `.env` file and configure these to your liking.

Here are the specific environment variables, and what they do:

* **`ADMIN_PASSWORD`**: This will protect the admin interface from elite hackers

* **`PORT`**: What port you want to run the server on

* **`DATABASE_URL`**: PostgresSQL connection string for your database

* **`SESSION_SECRET`**: A secret string used for session token hashing

* **`NEXT_ELECTION_DATE`**: Date of next election in `YYYY-MM-DD` format

* **`IGNORE_ELECTION_DEADLINES`**: If set to 'true', ignore upcoming deadlines and let users continue.
	Useful for when we are not near an election and do not have updated data from Google Civic.

* **`TWILIO_ACCOUNT_SID`**: Account string for Twilio

* **`TWILIO_AUTH_TOKEN`**: Auth token for Twilio

* **`TWILIO_FROM_NUMBER`**: From number for Twilio

* **`TWILIO_MESSAGING_SID`**: Account string for Twilio Messaging service

* **`TWILIO_NOTIFY_SID`**: Account string for Twilio Notify service (beta)

* **`FACEBOOK_PAGE_ID`**: Page ID for connecting Facebook Messenger (beta)

* **`SMARTY_STREETS_ID`**: Account string for SmartyStreets address verification

* **`SMARTY_STREETS_TOKEN`**: Auth token for SmartyStreets address verification

* **`TARGET_SMART_KEY`**: Auth token for TargetSmart VoterFile lookup

* **`VOTEBOT_API_KEY`**: key used to authenticate to votebot-forms


### Create the config.js file

Copy the `config.tpl.js` into a file called `config.js`. Since this file
references the environment variables you just defined, there's no need for extra
configuration. It's kind of an anachronism at this point.

### Populate the database with initial schema

To create the database tables and populate them with initial data, run:

```sh
node tools/run-schema.js
```

This command is safe to run multiple times and will ignore any existing data.


### Run the server!

Make sure your environment variables are loaded:

```sh
source .env
```

Then run the server:

```sh
node server.js
```

## Testing
- start conversation by POSTing ```{
     "type":"web",
    "recipients":[
        {"username": mobile}
    ]
}``` to `/conversations`
- connect Twilio number with POST to `/conversations/incoming`
- wipe user by sending DELETE to `/users/:username` with basic auth admin:admin_password from config


[1]: https://www.twilio.com
[2]: https://github.com/fightforthefuture/votebot-forms
[3]: http://www.eac.gov/voter_resources/register_to_vote.aspx
[4]: https://nodejs.org/en/
[5]: https://www.npmjs.com/
[6]: https://www.postgresql.org/
