var config = require('../config');
var util = require('../lib/util');
var notify = require('../models/notify');

var twilio = require('twilio')(config.twilio.account_sid, config.twilio.auth_token);
var service = twilio.notifications.v1.services(config.twilio.notify_sid);

console.log('listing bindings on', config.twilio.notify_sid);

count = 0;
service.bindings.each({
    tag: ['FL', 'votebot-started'],
    callback: function(binding) {
        count+=1;
        if (count % 100 == 0) { process.stdout.write('.'); }
    },
    done: function () {
        console.log(count+' bindings');
    }
});
