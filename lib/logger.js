var winston = require('winston');
var winston_sentry = require('winston-sentry');
var config = require('../config');

function maskSSN(msg, meta) {
	var match;
	if (match = msg.match(/[0-9]{3}-[0-9]{2}-[0-9]{4}/)) {
		msg = '***-**-****';
	}
	return {
		msg: msg,
		meta: meta
	};
}

function maskDate(msg, meta) {
	var match;

	// MM/DD/YYYY
	while (match = msg.match(/[\d]{1,2}\/[\d]{1,2}\/[\d]{4}/)) {
		var toBeMasked = match[0];
		if (toBeMasked) {
			msg = msg.replace(toBeMasked, '**/**/' + toBeMasked.substring(toBeMasked.length - 4));
		} else {
			break;
		}
	}

	 // YYYY-MM-DD format
	while (match = msg.match(/[\d]{4}-[\d]{1,2}-[\d]{1,2}/)) {
		var toBeMasked = match[0];
		if (toBeMasked) {
		    msg = msg.replace(toBeMasked, toBeMasked.substring(0,4)+'-**-**');
		} else {
			break;
		}
	}

	return {
		msg: msg,
		meta: meta
	};
}

var transports = [ new (winston.transports.Console)({ level: config.loglevel }) ];
if (config.sentry) {
	transports.push(
	    new winston_sentry({
            level: 'error',
            dsn: config.sentry
        })
    );
}

var logger = new (winston.Logger)({
	transports: transports,
	levels: {
		emerg: 0,
		alert: 1,
		crit: 2,
		error: 3,
		warn: 4,
		notice: 5,
		info: 6,
		debug: 7,
		trace: 8,
		debug2: 9
	},
	filters: [
		function (level, msg, meta) {
          return maskSSN(msg);
        },
        function (level, msg, meta) {
          return maskDate(msg, meta);
        }]
});

module.exports = logger;
