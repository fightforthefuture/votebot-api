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
		message.match(/yes/i) ||
		message.match(/^y$/i) ||
		message.match(/^y(e)?a(h)?/i) ||
		message.match(/^affirmative/i) ||
		message.match(/^o?k(ay)?$/i) ||
		message.match(/^sure/i) ||
		message.match(/^absolutely(?! *no)/i) ||
		message.match(/^(wh)?y *not/i);
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
		message.match(/^no more/i);
};

