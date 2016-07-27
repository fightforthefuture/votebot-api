var sha256 = require('sha256'),
    config = require('../config');

/**
 *  Generates a sort of unique ID based on the time and server session secret
 */
exports.sort_of_unique_id = function(str) {
    var str = str || '';
    return sha256.x2(config.session.secret + str + new Date().getTime()).substr(0, 60);
}