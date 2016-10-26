var config = require('../config');
var db = require('../lib/db');
var log = require('../lib/logger');
var convo_model = require('./conversation');

exports.log = function(user_id, from_chain, to_chain)
{
    log.info('chains_log: logging transition: ', user_id, from_chain, to_chain);
    
    return db.create('chains_log', {
        user_id: user_id,
        from_chain: from_chain,
        to_chain: to_chain,
        created: db.now()
    });
};