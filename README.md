# Votebot API

A node chatbot to guide users through a conversation to register them to vote. Signs them up for email alerts and election deadline notifications. Works over SMS and Facebook messenger (TBD). 

Works in tandem with [votebot-forms](fightforthefuture/votebot-forms) to submit registration data to their Secretary of State.

# Requirements
- node 4.4+
- postgres 9.5+ running

# Development
```sh
cd voterbot/
npm install
cp config.tpl.js config.js
vim config.js   # update default db name & password
node tools/run-schema.js
node server.js
```

# Testing

- start conversation by POSTing ```{
     "type":"web",
    "recipients":[
        {"username": mobile}
    ]
}``` to `/conversations`
- connect Twilio number with POST to `/conversations/incoming`
