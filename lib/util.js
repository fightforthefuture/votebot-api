exports.object = {
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
			if(type == 'undefined')
			{
				return obj[path];
			}
			obj = obj[path];
		}
		return obj;
	}
	// -------------------------------------------------------------------------
};

// ...let's build our own
exports.left_pad = function(string, padding)
{
	string = string.toString();
	return padding.slice(string.length) + string;
};

