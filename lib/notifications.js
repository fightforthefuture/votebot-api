var log = require('./lib/logger');

/**
 *  This array contains all configured notifications for the bot
 *  Each notification is of the form:
 *
 *      {
 *          type: '(NAME)',
 *          process: function(user, callback) {
 *              ...business logic...
 *              return callback({RESULT});
 *          }
 *      }
 *
 *  For RESULT, there are three types of objects that can be returned:
 *
 *  1. callback({})
 *     Pass an empty RESULT to effectively skip over this user. this is useful
 *     if they don't currently meet notification criteria, but may later
 * 
 *  2. callback({ chain: 'CHAIN_NAME' })
 *     If the user meets notification criteria, pass the chain property to
 *     send them the specified chain. The user will also be marked so this
 *     notification can not repeat in the future.
 *
 *  3. callback({ mark_sent: true })
 *     If the user does not and will never meet notification criteria, you can
 *     flag the notification as sent without actually sending anything to the
 *     user, so the notification does not process again.
 */

module.exports = [
    {
        type: 'gotv',
        process: function(user, callback) {
            log.info('    - Executing gotv_and_sharing for user: ', user.id);

            if (user.settings && user.settings.started_gotv) {
                log.info('    - USER ALREADY STARTED GOTV CHAIN. SKIPPING!');
                return callback({ mark_sent: true });
            }

            if (false) {    // JL TODO ~ put real GOTV selection criteria here.
                return callback({ chain: 'gotv' });
            } else {
                return callback({});
            }
        }
    },
    {
        type: 'sharing_test_1',
        process: function(user, callback) {
            log.info('    - Executing sharing_test_1 for user: ', user.id);
            return callback({ mark_sent: true });
        }
    }
];

