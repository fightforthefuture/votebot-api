var config = require('../config');
var log = require('./logger');

exports.send = function(res, object, options)
{
	options || (options = {});

	var status_code = options.status || 200;
	var content_type = options.content_type || 'application/json';
	res.setHeader('Content-Type', content_type);
	res
		.status(status_code)
	if (content_type === 'application/json') {
		res.send(JSON.stringify(object));
	} else {
		res.send(object);
	}
};

exports.error = function(res, generic_message, error, options)
{
	options || (options = {});
	error || (error = {});

	var code = error.code || options.status || 500;
	var content_type = options.content_type || 'application/json';
	var errobj = {
		problem: generic_message,
		message: error.message,
		stack: config.logging.error_responses ? (error.stack || null) : null
	};
	log.error('request: ', error, error.stack);
	res.setHeader('Content-Type', content_type);
	res
		.status(code)
		.send(JSON.stringify(errobj));
};

exports.redirect = function(res, url) {
	res.redirect(301, url);
};