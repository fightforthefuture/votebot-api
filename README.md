# Getting started

```sh
cd voterbot/
npm install
cp config.tpl.js config.js
vim config.js   # update default db name & password
node tools/run-schema.js
node server.js
```

# Requirements
- node 4.4+
- postgres 9.5+ running
