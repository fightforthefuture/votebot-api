var log = require('./logger');
var us_election = require('./us_election');
var config = require('../config');
var moment = require('moment');

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
        type: 'early_voting_and_mail_in',
        process: function(user, callback) {
            log.info('    - Executing early_voting_and_mail_in for user: ', user.id);

            // If the user has no settings then there's nothing to do (yet)
            if (!user.settings || !user.settings.state) return callback({});

            // Abort if the user hasn't completed the registration flow
            if (!user.complete) return callback({});

            if (user.settings.started_early_voting || user.settings.started_mail_in) {
                log.info('    - USER ALREADY STARTED CHAIN. SKIPPING!');
                return callback({ mark_sent: true });
            }

            var state = user.settings.state,
                ev_status = us_election.get_early_voting_or_mail_in(state);

            log.info('    - User state: ', user.settings.state);
            log.info('    - EV Status: ', ev_status);

            switch (ev_status) {
                case 'early-voting':
                    return callback({ chain: 'early_voting' });
                    break;
                case 'vote-by-mail':
                    return callback({ chain: 'mail_in' });
                    break;
                case 'none':
                case 'absentee-in-person':
                    return callback({ mark_sent: true });
                    break;
                default:
                    return callback({});
                    break;
            }
        }
    },
    {
        type: 'commit_to_vote',
        process: function(user, callback) {
            if (user.settings && user.settings.started_commit_to_vote) {
                log.info('    - USER ALREADY STARTED CHAIN. SKIPPING!');
                return callback({ mark_sent: true });
            }
            var electionDay = moment(config.election.date, 'YYYY-MM-DD');
            if (!moment().isAfter(electionDay.subtract(8, "days"), 'day')) {
                log.info('    - Not close enough to election day...');
                return callback({});
            }
            
            return callback({ chain: 'commit_to_vote' });
        }
    }
];

