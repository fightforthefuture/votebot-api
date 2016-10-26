var config = require('./config');
var db = require('./lib/db');
var l10n = require('./lib/l10n');
var conversation_model = require('./models/conversation');
var attrition_model = require('./models/attrition');
var bot_model = require('./models/bot');
var message_model = require('./models/message');

var ATTRITION_ADMIN_SUMMARY = '15_minutes';
var ATTRITION_QUERY = [
    'SELECT *',
    'FROM   conversations',
    'WHERE  nudged = false',
    'AND    complete = false',
    'AND    active = true',
    'AND    updated < now() - \'15 minutes\'::interval',
    'AND    updated > now() - \'30 minutes\'::interval',
];

db.query(
    ATTRITION_QUERY.join('\n'))
    .then(function(conversations) {
        console.log('Found conversations: ', conversations.length);
        return nudge(conversations);
    });

var nudge = function(stack) {
    if (stack.length == 0) {
        console.log('Nothing more to do. kthxbai');
        process.exit(0);
    }

    var conversation = stack.shift();

    if (
        conversation.state.step == 'first_name'
        ||
        conversation.state.step == 'incomplete'
        ||
        conversation.state.step == 'final_tmp'
    ) 
    {
        console.log('Skipping conversation ', conversation.id, ' in finished-ish state...');
        return nudge(stack);
    }

    console.log('Nudging conversation: ', conversation.id);
    console.log(' - first verifying this is the user\'s most recent conversation...');

    return db.one([
        'SELECT     cr.user_id, u.complete',
        'FROM       conversations_recipients cr, users u',
        'WHERE      cr.conversation_id={{conv_id}}',
        'AND        u.id = cr.user_id',
        'LIMIT      1'
        ].join('\n'),
        {conv_id: conversation.id}
    ).then(function(user) {
        console.log(' - user id is: ', user.user_id);
        if (!user) {
            console.log(' - User was deleted from conversation. SKIPPING!');
            return nudge(stack);
        } if (user.complete) {
            console.log(' - USER IS MARKED COMPLETE! SKIPPING!');
            return nudge(stack);
        } else {
            return db.one([
                    'SELECT conversation_id',
                    'FROM   conversations_recipients',
                    'WHERE  user_id = {{user_id}}',
                    'ORDER  BY created DESC',
                    'LIMIT  1'
                ].join('\n'),
                {user_id: user.user_id}
            );
        }
    }).then(function(latestConversation) {
        if (latestConversation.conversation_id != conversation.id) {
            console.log(' - USER HAS MORE RECENT CONVERSATION. SKIPPING!');
            return nudge(stack);
        } else {
            console.log(' - Conversation is current. creating attrition log...');
            return attrition_model.create({
                admin_summary:      ATTRITION_ADMIN_SUMMARY,
                conversation_id:    conversation.id,
                step_name:          conversation.state.step,
                dropoff_time:       conversation.updated,
                created:            db.now()
            }).then(function(attrition_log) {
                conversation.state.back = conversation.state.step;
                conversation.state.step = 'nudge';
                conversation.state.attrition_log_id = attrition_log.id;

                console.log(' - setting new state: ', conversation.state);
                return conversation_model.update(conversation.id, {
                    // JL NOTE ~ don't take them to a new question.
                    // literally just send them a "?" to nudge this conversation
                    // state: conversation.state,
                    nudged: true
                })
            }).then(function(whatever) {
                // var msg = l10n('prompt_nudge', conversation.locale);
                var msg = "?";

                console.log(' - sending message to user: ', msg);
                return message_model.create(
                    config.bot.user_id, conversation.id, {body: msg})
            }).then(function(lol) {
                console.log(' - Proceeding to next conversation...');
                return nudge(stack);
            });
        }
    });
  

};