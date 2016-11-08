var log = require('./logger');
var us_election = require('./us_election');
var config = require('../config');
var moment = require('moment-timezone');

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
/*
    {
        type: 'early_voting_and_mail_in',
        process: function(user) {
            log.info('    - Executing early_voting_and_mail_in for user: ', user.id);

            // return {} // JL DEBUG ~

            // ABORT IF WE'RE WITHIN TWO DAYS OF ELECTION
            var electionDay = moment(config.election.date, 'YYYY-MM-DD');
            if (moment().isAfter(electionDay.subtract(2, "days"), 'day')) {
                log.info('    - Too close to election day...');
                return { mark_sent: true };
            }

            // ABORT IF WE'RE NOT BETWEEN THE HOURS OF 9am PST and 8pm EST
            var time = moment(),
                startTime = moment('16:00:00', 'hh:mm:ss'),
                endTime = moment('23:59:59', 'hh:mm:ss');
    
            if (!time.isBetween(startTime, endTime)) {
                log.info('    - Time is not between 9am PST and 8pm EST! Skipping...');
                return {};
            }

            // If the user has no settings then there's nothing to do (yet)
            if (!user.settings || !user.settings.state) return {};

            // Abort if the user hasn't completed the registration flow
            if (!user.complete) return {};

            // Abort and mark as sent if user has started any GOTV-related flow
            if (
                user.settings.started_early_voting
                ||
                user.settings.started_mail_in
                ||
                user.settings.started_commit_to_vote
            ) {
                log.info('    - USER ALREADY STARTED CHAIN. SKIPPING!');
                return { mark_sent: true };
            }

            // Just to be safe, abort if user is already marked as voted
            if (user.voted) {
                log.info('    - USER ALREADY VOTED. THERE IS NO POINT TO THIS!');
                return { mark_sent: true };
            }

            var state = user.settings.state,
                ev_status = us_election.get_early_voting_or_mail_in(state);

            log.info('    - User state: ', user.settings.state);
            log.info('    - EV Status: ', ev_status);

            // Trigger the chain if we're in an early voting or vote-by-mail state
            // Abort and mark as sent if no Turbovote data, or is absentee state
            switch (ev_status) {
                case 'early-voting':
                    return { chain: 'early_voting' };
                    break;
                case 'vote-by-mail':
                    return { chain: 'mail_in' };
                    break;
                case 'none':
                case 'absentee-in-person':
                    return { mark_sent: true };
                    break;
                default:
                    return {};
                    break;
            }
        }
    },
    {
        type: 'commit_to_vote',
        process: function(user) {

            // ABORT IF WE'RE NOT WITHIN EIGHT DAYS OF ELECTION
            var electionDay = moment(config.election.date, 'YYYY-MM-DD');
            if (!moment().isAfter(electionDay.subtract(8, "days"), 'day')) {
                log.info('    - Not close enough to election day...');
                return {};
            }

            // ABORT IF WE'RE WITHIN TWO DAYS OF ELECTION
            if (moment().isAfter(electionDay.subtract(2, "days"), 'day')) {
                log.info('    - Too close to election day...');
                return { mark_sent: true };
            }

            // ABORT IF WE'RE NOT BETWEEN THE HOURS OF 9am PST and 8pm EST
            var time = moment(),
                startTime = moment('16:00:00', 'hh:mm:ss'),
                endTime = moment('23:59:59', 'hh:mm:ss');
    
            if (!time.isBetween(startTime, endTime)) {
                log.info('    - Time is not between 9am PST and 8pm EST! Skipping...');
                return {};
            }

            // Abort and mark as sent if user has started the commit-to-vote flow
            if (user.settings && user.settings.started_commit_to_vote) {
                log.info('    - USER ALREADY STARTED CHAIN. SKIPPING!');
                return { mark_sent: true };
            }

            // Abort if last notification was received within 24 hours of now
            if (
                user.last_notified
                &&
                moment(user.last_notified).add(24, 'hours').isAfter(moment())
                ) {
                log.info('    - LAST NOTIFICATION SENT WITHIN 24 HOURS. SKIP!');
                return {};
            }

            // Abort and mark as sent if the user is already marked as voted
            if (user.voted) {
                log.info('    - USER ALREADY VOTED. THERE IS NO POINT TO THIS!');
                return { mark_sent: true };
            }

            // OK, actually trigger the chain            
            return { chain: 'commit_to_vote' };
        }
    },
    */
    {
        type: 'gotv_1',
        process: function(user) {

            // ABORT IF IT'S NOT THE DAY BEFORE THE ELECTION
            var electionDay = moment.tz(config.election.date, 'America/New_York');
            if (
                !moment().tz('America/New_York').isSame(
                    electionDay.clone().subtract(1, "days"), 'day')
            ) {
                log.notice('    - Not the day before Election Day...');
                return {};
            }

            // ABORT IF WE'RE NOT BETWEEN THE HOURS OF 9am PST and 8pm EST
            var time = moment().tz('America/New_York');
    
            if (time.hour() < 12 || time.hour() > 20) {
                log.notice('    - Time is not between 9am PST and 9pm EST! Skipping...');
                return {};
            }

            // Abort and mark as sent if user has started the gotv_1 flow
            if (
                user.settings
                &&
                (
                    user.settings.started_gotv_1
                    ||
                    user.settings.started_gotv_2
                    ||
                    user.settings.started_gotv_3
                    ||
                    user.settings.started_gotv_4
                )
            ) {
                log.notice('    - USER ALREADY STARTED CHAIN. SKIPPING!');
                return { mark_sent: true };
            }

            // Abort and mark as sent if the user is already marked as voted
            if (user.voted) {
                log.notice('    - USER ALREADY VOTED. THERE IS NO POINT TO THIS!');
                return { mark_sent: true };
            }

            return { chain: 'gotv_1' };
        }
    },
    {
        type: 'gotv_2',
        process: function(user) {
            // ABORT IF IT'S NOT ELECTION DAY
            var electionDay = moment.tz(config.election.date, 'America/New_York');
    
            if (!moment().tz('America/New_York').isSame(electionDay.clone(), 'day')) {
                log.notice('    - Not Election Day...');
                return {};
            }

            // ABORT IF WE'RE NOT BETWEEN THE HOURS OF 9am PST and 8pm EST
            var time = moment().tz('America/New_York');
    
            if (time.hour() < 12 || time.hour() > 21) {
                log.notice('    - Time is not between 9am PST and 10pm EST! Skipping...');
                return {};
            }

            // Abort and mark as sent if user has started the gotv_2 or above
            if (
                user.settings
                &&
                (
                    user.settings.started_gotv_2
                    ||
                    user.settings.started_gotv_3
                    ||
                    user.settings.started_gotv_4
                )
            ) {
                log.notice('    - USER ALREADY STARTED CHAIN. SKIPPING!');
                return { mark_sent: true };
            }

            // Abort and mark as sent if the user is already marked as voted
            if (user.voted) {
                log.notice('    - USER ALREADY VOTED. THERE IS NO POINT TO THIS!');
                return { mark_sent: true };
            }

            return { chain: 'gotv_2' };
        },

    },
    {
        type: 'gotv_3',
        process: function(user) {
            // ABORT IF IT'S NOT ELECTION DAY
            var electionDay = moment.tz(config.election.date, 'America/New_York');
    
            if (!moment().tz('America/New_York').isSame(electionDay.clone(), 'day')) {
                log.notice('    - Not Election Day...');
                return {};
            }

            // ABORT IF WE'RE NOT BETWEEN THE HOURS OF 9am PST and 8pm EST
            var time = moment().tz('America/New_York');
    
            if (time.hour() < 10 || time.hour() > 21) {
                log.notice('    - Time is not between 7am PST and 10pm EST! Skipping...');
                return {};
            }

            // Abort and mark as sent if user has started the gotv_2 or above
            if (
                user.settings
                &&
                (user.settings.started_gotv_3 || user.settings.started_gotv_4)
            ) {
                log.notice('    - USER ALREADY STARTED CHAIN. SKIPPING!');
                return { mark_sent: true };
            }

            // Abort and mark as sent if the user is already marked as voted
            if (user.voted) {
                log.notice('    - USER ALREADY VOTED. THERE IS NO POINT TO THIS!');
                return { mark_sent: true };
            }

            // Abort and mark as sent if the user doesn't have a vote time scheduled
            if (!user.settings.vote_time) {
                log.notice('    - USER DIDN\'T SCHEDULE A VOTE TIME. SKIP FOR NOW.');
                return {};
            }

            var utcTime = moment();
            var voteTime = moment(user.settings.vote_time)
            log.notice('    - Current UTC time is: ', utcTime.toString());
            log.notice('    - Scheduled vote time: ', voteTime.toString());

            if (utcTime.isAfter(voteTime))
                return { chain: 'gotv_3' };

            log.notice('    - It\'s too soon to send this. Skipping for now.');

            return {};
        },
    },
   
];

