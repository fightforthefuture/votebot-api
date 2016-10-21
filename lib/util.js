exports.object = {
	/**
	 * merge one or more objects into an object (desctructive)
	 */
	merge: function(into, _)
	{
		var args = Array.prototype.slice.call(arguments, 1);
		args.forEach(function(obj) {
			Object.keys(obj).forEach(function(k) {
				into[k] = obj[k];
			});
		});
		return into;
	},

	// -------------------------------------------------------------------------
	// from Composer.js, copyright Lyon Bros. Enterprises, LLC, license MIT
	// -------------------------------------------------------------------------
	set: function(object, key, value)
	{
		object || (object = {});
		var paths = key.split('.');
		var obj = object;
		for(var i = 0, n = paths.length; i < n; i++)
		{
			var path = paths[i];
			if(i == n - 1)
			{
				obj[path] = value;
				break;
			}

			if(!obj[path])
			{
				obj[path] = {};
			}
			else if(typeof(obj) != 'object' || Array.isArray(obj))
			{
				obj[path] = {};
			}
			obj = obj[path];
		}
		return object;
	},
	get: function(object, key)
	{
		object || (object = {});
		var paths = key.split('.');
		var obj = object;
		for(var i = 0, n = paths.length; i < n; i++)
		{
			var path = paths[i];
			var type = typeof(obj[path]);
			if(type == 'undefined' || type == 'null')
			{
				return obj[path];
			}
			obj = obj[path];
		}
		return obj;
	},
	// -------------------------------------------------------------------------

	invert: function (object, options) {
		options || (options = {});
		var inverted = {};
		for (var property in object) {
			if(object.hasOwnProperty(property)) {
				if (options.transform == 'uppercase_keys')
					inverted[object[property].toUpperCase()] = property;
				else
					inverted[object[property]] = property;
			}
		}
		return inverted;
	}
};

// ...let's build our own
exports.left_pad = function(string, padding)
{
	string = string.toString();
	return padding.slice(string.length) + string;
};

// splits a string into an array of smaller strings (of length l)
// while avoiding splitting words up
exports.splitter = function(str, l) {
    var strs = [];
    while(str.length > l){
        var pos = str.substring(0, l).lastIndexOf(' ');
        pos = pos <= 0 ? l : pos;
        strs.push(str.substring(0, pos));
        var i = str.indexOf(' ', pos)+1;
        if(i < pos || i > pos+l)
            i = pos;
        str = str.substring(i);
    }
    strs.push(str);
    return strs;
};