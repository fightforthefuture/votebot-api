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
		message.match(/\bsi\b/i) ||
		message.match(/^y$/i) ||
		message.match(/^y(e)?a(h)?/i) ||
		message.match(/^affirmative/i) ||
		message.match(/^o?k(ay)?$/i) ||
		message.match(/^sure/i) ||
		message.match(/^absolutely(?! *no)/i) ||
		message.match(/^(wh)?y *not/i) ||
		message.match(/^예|네/i);
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
		message.match(/\bno\b/i) ||
		message.match(/^아니오/i);
};

/**
 * determines if a message is a "cancel" "quit" "stop" etc
 * this permanently ends the conversation, so don't add too many synonyms
 */
exports.is_cancel = function(message)
{
	message = clean(message);
	return false ||
		message.match(/^\s*(please)?\s*stop/i) ||
		message.match(/^cancel/i) ||
		message.match(/^quit/i) ||
		message.match(/^unsubscribe/i);
};

/**
 * determines if a message is a "skip"
 * ...don't "skip" to conclusions!!!
 */
exports.is_skip = function(message)
{
	message = clean(message);
	return false ||
		message.match(/^skip/i) ||
		message.match(/^saltar/i);
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
		message.match(/^error/i) ||
		message.match(/^ayuda/i);
		message.match(/^도움말/i);
};

exports.is_back = function(message)
{
	message = clean(message);
	return false ||
		message.match(/^\s*(go)?\s*back/i) ||
		message.match(/^mistake/i) ||
		message.match(/^fix/i) ||
		message.match(/^typo/i) ||
		message.match(/^regresa/i);
}

exports.military_or_overseas = function(message)
{
	message = clean(message);
	if(message.match(/\bmilitary\b/i) || message.match(/\bmilitar\b/i) || message.match(/\군인\b/i))
	{
		return 'military';
	}
	if(message.match(/\boverseas\b/i) || message.match(/\bextranjero\b/i) || message.match(/\해외\b/i))
	{
		return 'overseas';
	}
	return null;
};

exports.get_gender = function(message)
{
	message = clean(message);
	if(
		message.match(/\bmale\b/i)
		||
		message.match(/\bmasculino\b/i)
		||
		message.match(/^m$/i)
		||
		message.match(/^남성$/i)
	)
	{
		return 'male';
	}
	if(
		message.match(/\bfemale\b/i)
		||
		message.match(/\bfemenino\b/i)
		||
		message.match(/^f$/i)
		||
		message.match(/^여성$/i)
	)
	{
		return 'female';
	}
	return 'other/unspecified';
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

