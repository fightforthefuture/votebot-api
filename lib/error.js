/**
 * makes it easy to create errors we can send responses on, ie
 *
 *   error('Don\'t say that', {code: 400});
 *
 * can send back an HTTP 400 response (vs the default 500)
 */
module.exports = function(message, options)
{
	options || (options = {});
	var err = new (options.errclass ? options.errclass : Error)(message);
	if(options.code) err.code = options.code;
	return err;
};

