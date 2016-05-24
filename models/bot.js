var Promise = require('bluebird');
var config = require('../config');
var db = require('../lib/db');
var convo_model = require('./conversation');
var message_model = require('./message');
var user_model = require('./user');
var zip_model = require('./zip');
var error = require('../lib/error');
var util = require('../lib/util');
var language = require('../lib/language');
var log = require('../lib/logger');

// holds conversation chains. essentially, each "step" in the chain defines a
// part of the conversation (generally a question) and how to process the answer.
// this processing step can store data in various places as well as determine
// the next step in the conversationt to run.
var chains = {
	vote_1: {
		_start: 'intro_direct',
		intro_direct: {
			msg: 'Hi! Let\'s get you registered to vote. What\'s your full name?',
			process: simple_store('user.fullname', 'zip', 'Please enter your name')
		},
		intro_refer: {
			msg: 'Hi! One of your friends has asked me to help you get registered to vote. What\'s your full name?',
			process: simple_store('user.fullname', 'zip', 'Please enter your name')
		},
		zip: {
			msg: 'What\'s your zip code?',
			process: simple_store('user.settings.zip', 'address', 'Please enter your zip code', {validate: validate_zip})
		},
		address: {
			msg: 'What\'s your street address? (including apartment #, if any)',
			process: simple_store('user.settings.address', 'city', 'Please enter your address')
		},
		city: {
			pre_process: function(action, conversation, user) {
				if(util.object.get(user, 'settings.city')) return {next: 'state'};
			},
			msg: 'What city do you live in?',
			process: simple_store('user.settings.city', 'state', 'Please enter your city')
		},
		state: {
			pre_process: function(action, conversation, user) {
				if(util.object.get(user, 'settings.state')) return {next: 'dob'};
			},
			msg: 'What state do you live in? (eg MN)',
			process: simple_store('user.settings.state', 'dob', 'Please enter your state')
		},
		dob: {
			msg: 'When were you born? (MM/DD/YYYY)',
			process: simple_store('user.settings.dob', 'party', 'Please enter your birthday', {validate: validate_date})
		},
		party: {
			msg: 'What\'s your party preference? (democrat/republican/etc)',
			process: simple_store('user.settings.party_preference', 'mail', 'Please let us know your party preference')
		},
		mail: {
			msg: 'Would you like to vote by mail-in ballot?',
			process: simple_store('user.settings.mail_in', 'done', '', {validate: validate_boolean})
		},
		done: {msg: 'Thanks! We\'ll begin processing your registration! Share this bot to get your friends registered too: https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(config.app.url), final: true}
	}
};

// a helper for very simple ask-and-store type questions. can perform data
// validation as well.
function simple_store(store, next, errormsg, options)
{
	options || (options = {});
	return function(body)
	{
		// if we get an empty body, error
		if(!body.trim()) return data_error(errormsg, {promise: true});

		var obj = {};
		obj[store] = body;
		var promise = Promise.resolve({next: next, store: obj});
		if(options.validate)
		{
			promise = options.validate(body)
				.spread(function(body, extra_store) {
					extra_store || (extra_store = {});
					extra_store[store] = body;
					return {next: next, store: extra_store};
				});
		}
		return promise;
	};
}

// a useful helper for creating "data errors" ie, the code is fine, but some
// kind of issue exists in the data the user handed us for validation
function data_error(msg, options)
{
	options || (options = {});

	var err = new Error(msg);
	err.data_error = true;
	if(options.promise) err = Promise.reject(err);
	return err;
}

function validate_date(body)
{
	var date = new Date(body);
	if(date.toString().match(/invalid/i)) return Promise.reject(data_error('We couldn\'t read that date'));

	body = [
		util.left_pad(date.getFullYear(), '0000'),
		util.left_pad(date.getMonth() + 1, '00'),
		util.left_pad(date.getDate(), '00'),
	].join('/');
	return Promise.resolve([body]);
};

function validate_boolean(body)
{
	return Promise.resolve([!!language.is_yes(body)]);
};

function validate_zip(body)
{
	var zip = body.replace(/-.*/, '');
	if(!zip.match(/^[0-9]{5}$/)) return Promise.reject(data_error('That zip code isn\'t valid'));
	return zip_model.find(zip)
		.then(function(zipdata) {
			var zip = zipdata.code;
			if(!zip) return reject(data_error('We couldn\'t find that zip code'));

			var places = zipdata.places;
			var setter = {};
			// if we have 0 (or 2 or more) places, we cannot assume a location,
			// so we only populate the city/state fields if we get one location
			if(places.length == 1)
			{
				var place = places[0];
				var city = place.city;
				var state = place.state;
				if(city) setter['user.settings.city'] = city;
				if(state) setter['user.settings.state'] = state;
			}
			return [zip, setter];
		})
		.catch(function(err) { return err && err.message == 'not_found'; }, function(err) {
			throw data_error('We couldn\'t find that zip code');
		});
};

var parse_step = function(step, body)
{
	// if the user is canceling, don't bother parsing anything
	if(language.is_cancel(body)) return Promise.resolve({next: '_cancel'});
	return step.process(body);
};

/**
 * given an action, conversation, and user objects, determine the next step in
 * the conversation chain to load.
 */
var find_next_step = function(action, conversation, user)
{
	var state = conversation.state;
	var next = action.next;

	var key = [state.type, next].join('.');
	var nextstep = util.object.get(chains, key);
	if(!nextstep) throw new Error('bot: could not load step: '+ key);

	var default_step = {step: nextstep, name: next};

	if(!nextstep.pre_process) return default_step;
	// call pre-process on our new step.
	var res = nextstep.pre_process(action, conversation, user);
	if(!res || !res.next) return default_step;

	// if our pre_process returns a "next" key, then we know we should load
	// another step. wicked. recurse and find that shit.
	var action = util.object.merge({}, action, {next: res.next});
	return find_next_step(action, conversation, user);
};

/**
 * start a bot-initiated conversation
 */
exports.start = function(type, to_user_id, options)
{
	options || (options = {});
	var user;
	return user_model.get(to_user_id)
		.then(function(_user) {
			user = _user;
			if(!user) throw error('user '+user_id+' was not found');
			var chain = chains[type];
			var first_step_name = options.start || chain._start;
			var step = chain[first_step_name];
			if(!step) throw new Error('bot: error loading step: '+type+'.'+step);
			return convo_model.create(config.bot.user_id, {
				type: 'bot',
				state: {type: type, step: first_step_name},
				recipients: [user],
				message: { body: step.msg }
			});
		});
};

/**
 * processes an incoming message to our beloved bot. handles loading the convo
 * state, parsing/processing the user's incoming message, and loading the next
 * chain in the conversation.
 */
exports.next = function(user_id, conversation, message)
{
	var user;
	return user_model.get(user_id)
		.then(function(_user) {
			user = _user;
			if(!user) throw error('user '+user_id+' was not found');
			var state = conversation.state;
			var key = [state.type, state.step].join('.');
			var step = util.object.get(chains, key);
			if(!step) throw error('conversation chain missing: '+key);

			// we've reached the final step, do nothing
			// TODO: maybe have some kind of prompt or CTA here?
			if(step.final)
			{
				log.info('bot: recv msg, but conversation finished');
				return;
			}

			var body = message.body;
			return parse_step(step, body)
				.then(function(action) {
					log.info('bot: action: ', JSON.stringify(action));

					// if user wants out, let them
					if(action.next == '_cancel') return convo_model.close(conversation.id);

					var promise = Promise.resolve();

					// if we're storing value(s) into object(s), loop over our
					// setters and set them into the object we're saving.
					//
					// NOTE: currently, you can only run multiple setters on
					// *one object*. so you can do user.name and user.age
					// in one pass, but you cannot do user.name and
					// conversation.date...this code would need to be updated
					// to support this and we just don't need it right now
					if(action.store)
					{
						// a set of objects we're allowed to set via the convo chain
						var setters = {
							user: {
								obj: user,
								set: function(obj) { return user_model.update(user_id, obj); }
							}
						};
						var keys = Object.keys(action.store);
						// grab the object we're setting data into based on
						// the FIRST key in our setter object. as mentioned
						// above, we currently only support setting data
						// into one top-level object
						var obj = keys[0].replace(/\..*/, '');
						var setter = setters[obj];
						if(setter)
						{
							keys.forEach(function(place) {
								// grab the value from our setter
								var value = action.store[place];
								// user.settings.address becomes settings.address
								place = place.replace(/^.*?\./, '');
								// recursively set our value into our main object
								util.object.set(setter.obj, place, value);
							});
							// replace the promise with our async setter
							// function's promise (eg, user_model.update)
							promise = setter.set(setter.obj);
						}
					}

					// we're processing the next step, inject some steps
					// into the promise chain
					promise = promise
						.then(function() {
							// get our next step from the conversation chain
							var found = find_next_step(action, conversation, user);
							var nextstep = found.step;

							// destructively modify our convresation state object,
							// replacing the "step" value with our new step's name.
							// this will get saved once our message goes out
							state.step = found.name;

							// create/send the message from the next step in the convo chain
							return message_model.create(config.bot.user_id, conversation.id, {body: nextstep.msg});
						})
						.then(function() {
							// save our current state into the conversation so's
							// we know where we left off when the next message
							// comes in
							return convo_model.update(conversation.id, {state: state});
						});

					// all done
					return promise;
				})
				// catches ALL errors, whether in validation or in code.
				.catch(function(err) {
					if(err.data_error)
					{
						log.notice('bot: next: data error: ', err);
						var message = err.message+'. Please try again!';
					}
					else
					{
						log.error('bot: next: ', err, err.stack);
						var message = 'I seem to have had a glitch. Please send your last message again.';
					}
					return message_model.create(config.bot.user_id, conversation.id, {body: message});
				})
				// error catching errors. ABORT
				.catch(function(err) {
					log.crit('bot: fatal (giving up): ', err, err.stack);
				});
		});
};

