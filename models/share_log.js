var config = require('../config');
var db = require('../lib/db');
var log = require('../lib/logger');
var convo_model = require('./conversation');

exports.log = function(data)
{
    data.created = db.now();
    return convo_model.get_recent_by_user(data.user_id)
        .then(function(conversation) {
            if (!conversation || !conversation.state || !conversation.state.from)
                return false;

            data.from_chain = conversation.state.from;
            return db.create('share_log', data);
        });
	
};