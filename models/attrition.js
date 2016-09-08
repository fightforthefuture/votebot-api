var config = require('../config');
var db = require('../lib/db');

exports.create = function(data)
{
	return db.create('attrition_log', data);
};

exports.update = function(attrition_log_id, data)
{
	data.updated = db.now();
	return db.update('attrition_log', attrition_log_id, data);
};