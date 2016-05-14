var winston = require('winston');
var config = require('../config');

var logger = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({ level: config.loglevel }),
	],
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
	}
});

module.exports = logger;

