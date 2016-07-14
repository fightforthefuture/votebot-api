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
			if(type == 'undefined')
			{
				return obj[path];
			}
			obj = obj[path];
		}
		return obj;
	},
	// -------------------------------------------------------------------------

	invert: function (object) {
		var inverted = {};
		for (var property in object) {
			if(object.hasOwnProperty(property)) {
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

