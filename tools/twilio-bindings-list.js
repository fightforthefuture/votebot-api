var config = require('../config');
var util = require('../lib/util');
var notify = require('../models/notify');

var twilio = require('twilio')(config.twilio.account_sid, config.twilio.auth_token);
var service = twilio.notifications.v1.services(config.twilio.notify_sid);

console.log('listing bindings on', config.twilio.notify_sid);
count = 0;
bogus_count = 0;
service.bindings.each({
    callback: function(binding) {
        if (binding.endpoint.indexOf(config.environment) > 0) {
            count+=1;
            if (count % 100 == 0) { process.stdout.write('.'); }
        } else {
            bogus_count+=1;
        }
    },
    done: function() {
        console.log(count+' '+config.environment+' bindings');
        console.log(bogus_count+' bogus bindings');    
    }
});
