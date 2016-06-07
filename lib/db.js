/**
 * this file acts as an extremely poor-(wo)man's ORM. it takes care of some
 * common db tasks, but does so in a way that it only is there when needed...it
 * doesn't try to own the entire database.
 *
 * note that its upsert() function *requires* postgres >= 9.5
 */

var config = require('../config');
var pg = require('pg');
var Promise = require('bluebird');
var log = require('./logger');

var dbconf = config.database;
if(dbconf.connstr) var connstr = dbconf.connstr;
else var connstr = 'postgres://'+dbconf.user+(dbconf.password ? ':'+dbconf.password : '')+'@'+dbconf.server+':'+dbconf.port+'/'+dbconf.database;

if(dbconf.ssl) pg.defaults.ssl = true;

/**
 * clean out strings to be used as raw db literals (table and column names)
 */
var clean = function(str)
{
	return str.replace(/[^0-9a-z_"-]/g, '');
};

/**
 * query builder. turns
 *
 *   SELECT id FROM table WHERE name = {{name}} AND {{where|raw}} OR date < {{now}}
 *   {name: 'timmy', where: 'x = 5', now: db.literal('now()')}
 *
 * into
 *
 *   SELECT id FROM table WHERE name = $1 AND x = 5 OR date < now()
 *   ['timmy']
 *
 * note that using {{varname|raw}} and specifying db.literal('somefunc()') are
 * very similar, yet the former can be called in the qry itself, the latter in
 * the values.
 */
var builder = function(qry, vars)
{
	vars || (vars = {});
	var vals = [];
	qry = qry.replace(/\{\{([0-9a-z_-]+)(\|raw)?\}\}/gi, function(_, key, raw) {
		var val = (typeof(vars[key]) == 'undefined' ? '' : vars[key]);
		if(val && val._literally)
		{
			return val._literally;
		}
		if(val === null) val = val;
		else if(typeof(val) == 'object') val = JSON.stringify(val);
		else val = val.toString();
		if(raw) return val;
		vals.push(val);
		return '$'+(vals.length);
	});
	return {query: qry, vals: vals};
};

// use this to wrap your arguments to be injected as literals. literally.
exports.literal = function(val) { return {_literally: val}; };

// quick helper to reduce typing
exports.now = function() { return exports.literal('NOW()'); };

/**
 * run a query, using a pooled connection, and return the result as a finished
 * promise.
 */
exports.query = function(qry, vars, options)
{
	options || (options = {});

	var type = options.type;
	var built = builder(qry, vars);
	var qry = built.query;
	var vals = built.vals;

	log.debug('qry: ', qry, vals);

	return new Promise(function(resolve, reject) {
		pg.connect(connstr, function(err, client, done) {
			if(err) return reject(err);
			client.query(qry, vals, function(err, result) {
				done();
				if(err) return reject(err);
				switch((type || result.command).toLowerCase())
				{
				case 'select':
					resolve(result.rows);
					break;
				default:
					resolve(result);
					break;
				}
			});
		});
	});
};

/**
 * wraps query(), pulls out the first record
 */
exports.one = function(qry, vars, options)
{
	options || (options = {});

	return exports.query(qry, vars, options)
		.then(function(res) { return res[0]; });
};

/**
 * builds an insert query. supports bulk inserts, given an array of data with
 * uniform key names
 */
var build_insert = function(table, data, options)
{
	options || (options = {});

	if(!Array.isArray(data)) data = [data];

	if(data.length == 0) throw new Error('db.insert: empty collection given');
	var keys = Object.keys(data[0]);
	var keystr = keys.map(function(k) { return '"'+clean(k)+'"'; });
	var valstr = [];
	data.forEach(function(_, rownum) {
		valstr.push('('+keys.map(function(_, i) { return '{{--insert-val-row'+rownum+'-'+i+'}}'; })+')');
	});

	var vals = {};
	data.forEach(function(row, rownum) {
		keys.forEach(function(key, i) {
			vals['--insert-val-row'+rownum+'-'+i] = row[key];
		});
	});
	var qry = 'INSERT INTO '+clean(table)+' ('+keystr+') VALUES '+valstr.join(',');
	return {query: qry, vals: vals};
};

/**
 * create an object in a table. uses the data passed in verbatim, so if you pass
 * in fields to `data` that don't exist in the database, then you'll get errors.
 * so be careful what you pass. this ain't sequelize.
 *
 * returns the latest version of the created object.
 */
exports.create = function(table, data, options)
{
	options || (options = {});
	try
	{
		var built = build_insert(table, data, options);
	}
	catch(err)
	{
		return Promise.reject(err);
	}
	var qry = built.query;
	qry += ' RETURNING '+clean(table)+'.*;';
	return exports.query(qry, built.vals, {type: 'select'})
		.then(function(res) {
			if(Array.isArray(data)) return res;
			else return res[0];
		});
};

/**
 * wrapper to update one object in one table by its primary key id, and returns
 * the entire updated row
 */
exports.update = function(table, id, data, options)
{
	options || (options = {});
	var id_key = options.id_key || 'id';

	var sets = Object.keys(data).map(function(key) {
		return key+' = {{'+key+'}}';
	});
	var qry = 'UPDATE '+clean(table)+' SET '+sets.join(', ')+' WHERE '+clean(id_key)+' = {{id}} RETURNING *';
	var copy = JSON.parse(JSON.stringify(data));
	copy.id = id;
	return exports.query(qry, copy, {type: 'select'})
		.then(function(res) { return res[0]; });
};

/**
 * creates or updates an existing record. uses `key` to determine the existence
 * of a record (`key` must be the name of a uniquely indexed column). if the
 * record doesn't exist, `data` is used to create it. if it does exist, `data`
 * is used to update the existing record.
 *
 * no matter what, the most recent version of the record is returned.
 */
exports.upsert = function(table, data, key, options)
{
	options || (options = {});
	if(!data[key]) return Promise.reject(new Error('db.upsert: `key` field not present in `data`'));
	if(Array.isArray(data)) return Promise.reject(new Error('db.upsert: `data` cannot be an array.'));

	var keys = Object.keys(data);
	try
	{
		var built = build_insert(table, data, options);
	}
	catch(err)
	{
		return Promise.reject(err);
	}
	var qry = built.query;
	var vals = built.vals;

	qry += ' ON CONFLICT ('+clean(key)+') ';

	// NOTE: AL: i'd rather not do a blanket update here if not needed, but pg
	// only applies RETURNING when the data has changed
	qry += 'DO UPDATE SET ';
	qry += keys.map(function(col, i) {
		var tplvar = '--upsert-var-'+i;
		vals[tplvar] = data[col];
		return col+' = {{'+tplvar+'}}'
	}).join(', ');

	qry += ' RETURNING '+clean(table)+'.*;';

	return exports.query(qry, vals, {type: 'select'})
		.then(function(res) {
			return res[0];
		});
};

//exports.create('users', {mobile: '+0912132'})
//	.then(function(res) { console.log('res: ', JSON.stringify(res, null, 2)); })
//	.catch(function(err) { console.log(err, err.stack); });

