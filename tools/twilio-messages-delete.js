var config = require('../config');

var twilio_client = require('twilio')(config.twilio.account_sid, config.twilio.auth_token);
console.log('deleting messages to '+config.twilio.from_number);

count = 0;

twilio_client.messages.each({callback: function(message) {
        // dont' actually delete, so we still have counts
        // but set body to null
        message.update({body: ''}, function() {
            count+=1;
            if (count % 100 == 0) { process.stdout.write('.'); }
        })
    }, done: function() {
        console.log(count+' messages deleted');
    }
})