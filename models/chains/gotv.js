var log = require('../../lib/logger');

module.exports = {
    intro: {
        process: function() {
            log.info('bot: gotv: no message is ever sent for this step lol');
            return Promise.resolve({'next': 'gotv_prompt_1'})
        }
    },
    gotv_prompt_1: {
        process: function(body, user, step, conversation) {
            log.info('bot: gotv: doing something amazing with the result');
            return Promise.resolve({'next': 'gotv_prompt_1'})
        }
    }
}