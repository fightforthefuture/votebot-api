#!/bin/bash

echo "Copying config.heroku.js -> config.js"
cp config.heroku.js config.js

echo "Running schema (${DATABASE_URL})"
node tools/run-schema.js

