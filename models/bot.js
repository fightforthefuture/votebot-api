var config = require('../config');
var db = require('../lib/db');
var convo_model = require('./conversation');
var message_model = require('./message');
var user_model = require('./user');
var error = require('../lib/error');
var util = require('../lib/util');
var language = require('../lib/language');
var log = require('../lib/logger');

// holds our conversation chains. since these are stored as indexes in the db,
// (ie step 1 is chains.vote[0][0] so stored as "0" in the conversation state)
// these cannot be re-ordered, and instead new chains must be created so
// in-progress conversations aren't corrupted.
var chains = {
	vote: [
		[
			{msg: 'Would you like to register to vote? Type "yes" to begin, "no" to cancel.', yes: 'next', no: 'cancel'},
			{msg: 'What\'s your full name?', store: 'user.fullname'},
			{msg: 'What\'s your full address? (street address, city, state, zip)', store: 'user.settings.address'},
			{msg: 'When were you born? (MM/DD/YYYY)', format: 'date', store: 'user.settings.birthday'},
			{msg: 'What\'s your party preference? (democrat/republican/etc)', store: 'user.settings.party_preference'},
			{msg: 'Would you like to vote by mail-in ballot?', format: 'boolean', store: 'user.settings.mail_in'},
			{msg: 'Thanks! We\'ll begin processing your registration!', final: true}
		],
		// next vote chain goes here
	]
};

var parse_step = function(step, body)
{
	if(step.format)
	{
		switch(step.format)
		{
			case 'date':
				var date = new Date(body);
				body = [
					util.left_pad(date.getFullYear(), '0000'),
					util.left_pad(date.getMonth() + 1, '00'),
					util.left_pad(date.getDate(), '00'),
				].join('/');
				break;
			case 'boolean':
				body = !!language.is_yes(body);
				break;
		}
	}

	var action = null;
	if(language.is_cancel(body))
	{
		action = {name: 'cancel'};
	}
	else if(step.yes)
	{
		action = {name: language.is_yes(body) ? step.yes : step.no};
	}
	else if(step.store)
	{
		action = {name: 'next', store: step.store, value: body};
	}
	else
	{
		action = {name: 'unknown'};
	}
	return action;
};

/**
 * start a bot-initiated conversation
 */
exports.start = function(type, to_user_id)
{
	var user;
	return user_model.get(to_user_id)
		.then(function(_user) {
			user = _user;
			if(!user) throw error('user '+user_id+' was not found');
			var chain = chains[type].length - 1;
			return convo_model.create(config.bot.user_id, {
				type: 'bot',
				state: {type: type, chain: chain, step: 0},
				recipients: [user],
				message: { body: chains[type][chain][0].msg }
			});
		});
};

exports.next = function(user_id, conversation, message)
{
	var user;
	return user_model.get(user_id)
		.then(function(_user) {
			user = _user;
			if(!user) throw error('user '+user_id+' was not found');
			var state = conversation.state;
			var key = [state.type, state.chain, state.step].join('.');
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
			var action = parse_step(step, body);
			log.info('bot: action: ', action);

			// if user wants out, let them
			if(action.name == 'cancel') return convo_model.close(conversation.id);

			// oh well
			if(action.name == 'unknown') throw error('bot: chain parse error: '+JSON.stringify(step)+' -- '+JSON.stringify(body));

			var promise = Promise.resolve();
			if(action.name == 'next')
			{
				if(action.store)
				{
					var place = action.store;
					var value = action.value;
					var obj = place.replace(/\..*/, '');
					place = place.replace(/^.*?\./, '');

					// a set of objects we're allowed to set via the convo chain
					var setters = {
						user: {
							obj: user,
							set: function(obj) { return user_model.update(user_id, obj); }
						}
					};
					var setter = setters[obj];
					if(setter)
					{
						util.object.set(setter.obj, place, value);
						promise = setter.set(setter.obj);
					}
				}
				promise = promise
					.then(function() {
						state.step++;
						var key = [state.type, state.chain, state.step].join('.');
						var nextstep = util.object.get(chains, key);
						return message_model.create(config.bot.user_id, conversation.id, {body: nextstep.msg});
					})
					.then(function() {
						return convo_model.update(conversation.id, {state: state});
					});
			}
			return promise
				.then(function() {
				});
		});
};

