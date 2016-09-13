var util = require('../lib/util');
var l10n = require('../lib/l10n');

/**
 * this is a poor-(wo)man's NLP / sentiment parsing using some crappy regexes
 */

/**
 * remove junk from messages and format them
 */
var clean = function(message)
{
	return message.toString()
		.replace(/\b(um+|uh+)\b/, '')
		.replace(/^\s+/, '')
		.replace(/\s+/, ' ');
};

/**
 * determines if a message is affirmative
 */
exports.is_yes = function(message)
{
	message = clean(message);
	return false ||
		message.match(/\byes\b/i) ||
		message.match(/^y$/i) ||
		message.match(/^y(e)?a(h)?/i) ||
		message.match(/^affirmative/i) ||
		message.match(/^o?k(ay)?$/i) ||
		message.match(/^sure/i) ||
		message.match(/^absolutely(?! *no)/i) ||
		message.match(/^(wh)?y *not/i);
};

/**
 * determines if a message is affirmative
 */
exports.is_no = function(message)
{
	message = clean(message);
	return false ||
		message.match(/^no(pe)?/i) ||
		message.match(/^negat(ive|ory)/i) ||
		message.match(/^nah/i) ||
		message.match(/^neither/i) ||
		message.match(/^n$/i) ||
		message.match(/\bno\b/i);
};

/**
 * determines if a message is a "cancel" "quit" "stop" etc
 */
exports.is_cancel = function(message)
{
	message = clean(message);
	return false ||
		message.match(/^\s*(please)?\s*stop/i) ||
		message.match(/^cancel/i) ||
		message.match(/^quit/i) ||
		message.match(/^unsubscribe/i) ||
		message.match(/^end/i) ||
		message.match(/^no more/i);
};


/**
 * determines if a message is a "help"
 */
exports.is_help = function(message)
{
	message = clean(message);
	return false ||
		message.match(/^help/i) ||
		message.match(/^help\s*(me)?\s/i) ||
		message.match(/^question/i) ||
		message.match(/^error/i);
		message.match(/^problem/i);
};

exports.is_back = function(message)
{
	message = clean(message);
	return false ||
		message.match(/^\s*(go)?\s*back/i) ||
		message.match(/^mistake/i) ||
		message.match(/^fix/i) ||
		message.match(/^typo/i);
}

exports.military_or_overseas = function(message)
{
	message = clean(message);
	if(message.match(/\bmilitary\b/i))
	{
		return 'military';
	}
	if(message.match(/\boverseas\b/i))
	{
		return 'overseas';
	}
	return null;
};

exports.get_gender = function(message)
{
	message = clean(message);
	if(message.match(/\bmale\b/i) || message.match(/^m$/))
	{
		return 'male';
	}
	if(message.match(/\bfemale\b/i) || message.match(/^f$/))
	{
		return 'female';
	}
	return null;
};

exports.template = function template(str, data, locale)
{
	locale || (locale = 'en');

	// TODO, translatable?
	if (!str) { return; }

	str = str.replace(/\[\[(.*?)\]\]/g, function(all, key) {
		var val = l10n(key, locale);
		return val || key;
	});

	if (data)
		str = str.replace(/{{(.*?)}}/g, function(all, key) {
			var val = util.object.get(data, key);
			return val || '';
		});
	
	return str;
}

