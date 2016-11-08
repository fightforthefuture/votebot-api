var Promise = require('bluebird');
var config = require('../../config');
var log = require('../../lib/logger');
var language = require('../../lib/language');
var l10n = require('../../lib/l10n');
var util = require('../../lib/util');
var us_election = require('../../lib/us_election');
var validate = require('../../lib/validate');

var bot_model = require('../bot');
var polling_place_model = require('../../lib/polling_place');
var weather_model = require('../../lib/weather_report');
var user_model = require('../user');
var message_model = require('../message');
var notify = require('../notify');
var convo_model = require('../conversation');
var shorten = require('../../lib/shortener');

var moment = require('moment');
var momentTZ = require('moment-timezone');
var timezone_lib = require('../../lib/timezone');

module.exports = {
    intro: {
        process: function(body, user, step, conversation) {
            log.info('bot: gotv 1: intro');
            /*
            if (
                (
                    user.notifications
                    &&
                    user.notifications.sent
                    &&
                    user.notifications.sent.indexOf('gotv_1') > -1
                    &&
                    !util.object.get(user, 'settings.gotv_1_prompted_for_input')
                )
            )
            {
                return Promise.resolve({next: 'prompt_for_input'});
            }
            */

            var result = {
                'store': {'user.settings.started_gotv_1': true}
            }
            if (!util.object.get(user, 'first_name')) {
                result['next'] = 'first_name';
                return Promise.resolve(result);
            };
            if (!util.object.get(user, 'settings.zip')) {
                result['next'] = 'zip';
                return Promise.resolve(result);
            };
            if (!util.object.get(user, 'settings.address')) {
                result['next'] = 'address';
                return Promise.resolve(result);
            };

            log.info('bot: gotv: looking up polling place info');

            return polling_place_model.lookup(user.settings.address, user.settings.city, user.settings.state)
            .then(function(polling_place) {
                var gttp_link = "https://gttp.votinginfoproject.org/"+
                    encodeURIComponent('#' + user.settings.address+' '+user.settings.city+' '+user.settings.state);
                return shorten(gttp_link).then(function(short_link) {
                    if (polling_place) {
                        polling_place.link = short_link;
                    } else {
                        polling_place = {link: 'http://gettothepolls.com'};
                    }
                    return Promise.resolve({
                        next: 'schedule_vote_time',
                        store: {
                            'user.settings.started_gotv_1': true,
                            'user.results.polling_place': polling_place
                        }
                    });
                });
            }).catch(function(error) {
                log.error('shorten_url error', error);
                result['next'] = 'schedule_vote_time';
                return Promise.resolve(result);
            });
        }
    },
    prompt_for_input: {
        name: 'prompt_for_input',
        msg: '',
        no_msg: true,
        pre_process: function(action, conversation, user) {
            var msg = l10n('msg_gotv_1_reintro_from_notification', conversation.locale);
            msg = msg.replace('{{first_name}}', user.first_name ? user.first_name : 'again');
            return {
                msg: msg
            }
        },
        process: function(body, user, step, conversation) {
            if (
                body.toLowerCase().indexOf('already') > -1
                ||
                body.toLowerCase().indexOf('voted') > -1
                ) {
                return Promise.resolve({switch_chain: 'i_voted'})
            }
            return Promise.resolve({
                next: 'intro',
                store: {
                    'user.settings.gotv_1_prompted_for_input': true
                },
                advance: true
            })
        }
    },
    schedule_vote_time: {
        pre_process: function(action, conversation, user) {
            // TODO, convert election_day offset to human time
            // so we don't assume it's "tomorrow"

            var msg = '';
            
            if (!util.object.get(user, 'settings.gotv_1_prompted_for_input')) {
                if (us_election.is_election_day())
                    msg = msg + l10n('msg_election_day_today', conversation.locale);
                else 
                    msg = msg + l10n('msg_election_day_tomorrow', conversation.locale);
            }

            polling_address = util.object.get(user, 'results.polling_place.address');

            if (polling_address) {
                msg = msg + ' ' +l10n('msg_polling_place', conversation.locale);

                if (polling_address.locationName) {
                    msg = msg.replace('{{location}}', polling_address.locationName)
                } else {
                    msg = msg.replace('{{location}}', polling_address.line1)
                }

                msg = msg.replace('{{location_city}}', polling_address.city.trim());

            } else {
                msg = msg + ' ' + l10n('msg_lookup_polling_place', conversation.locale);
            }
            msg = msg + '\n' + l10n('prompt_schedule_vote_time', conversation.locale);

            return {msg: language.template(msg, user)}
        },
        process: function(body, user, step, conversation) {
            if (
                body.toLowerCase().indexOf('already') > -1
                ||
                body.toLowerCase().indexOf('voted') > -1
                ) {
                return Promise.resolve({switch_chain: 'i_voted'})
            } else if (body.toLowerCase().indexOf('woltato') > -1) {
                return Promise.resolve({switch_chain: 'gotv_2'})
            } else if (body.toLowerCase().indexOf('protopato') > -1) {
                return Promise.resolve({switch_chain: 'gotv_4'})
            } else if (body.toLowerCase().indexOf('now') > -1) {
                return Promise.resolve({next: 'prompt_for_voted'})
            }
            // look up user local timezone
            log.info('bot: gotv: looking up timezone');
            return timezone_lib.from_zipcode(user.settings.zip).then(function(local_tz_name) {
                log.info('bot: gotv: timezone is: ', local_tz_name);
                // parse time with moment, and place it on election day
                return validate.time(body, user, conversation.locale).then(function(parsed_time) {
                    var time_str = config.election.date+' '+parsed_time['0'];
                    var vote_time_local = moment.tz(time_str, local_tz_name);

                    log.info('bot: parsed_time: ', parsed_time);
                    log.info('bot: time_str: ', time_str);
                    log.info('bot: gotv: vote_time_local: '+vote_time_local.format());

                    // schedule gotv_3 chain to trigger one hour before vote_time_schedule_utc
                    var vote_time_utc = vote_time_local.clone().utc();
                    var vote_time_schedule_utc = vote_time_local.clone().subtract(1, 'hours').utc();

                    log.info('bot: gotv: vote_time_utc: '+vote_time_utc.format());
                    log.info('bot: gotv: vote_time_schedule_utc: '+vote_time_schedule_utc.format());

                    // store timezone name and UTC times to user
                    var update_user = util.object.set(user, 'settings.timezone', local_tz_name);
                    var update_user = util.object.set(update_user, 'settings.vote_time', vote_time_utc.format());
                    var update_user = util.object.set(update_user, 'settings.vote_time_schedule', vote_time_schedule_utc.format());

                    if (us_election.is_election_day())
                        var update_user = util.object.set(update_user, 'settings.started_gotv_2', true);
                    
                    return user_model.update(user.id, update_user);
                });
            }).then(function(user) {
                if (!user) { 
                    return;
                }
                var vote_time = util.object.get(user, 'settings.vote_time');
                if (!vote_time) {
                    // fake it, assume election day
                    var vote_time = moment(config.election.date, 'YYYY-MM-DD');
                }
                // look up weather for next step in process, bc we can't do async in pre_process  
                // calculate days_out from vote_time minus current_time
                var now = moment();
                var days_out = moment(vote_time).diff(now.utc(), 'days');
                log.info('bot: gotv: looking up weather '+days_out+' days out');
                return weather_model.forecast(user.settings.city, user.settings.state, days_out).then(function(forecast) {
                    log.info('bot: gotv: forecast is: ', forecast);
                    return Promise.resolve({
                        next: 'schedule_weather',
                        store: {'user.results.weather_forecast': forecast}
                    });

                });
            });
        }
    },
    schedule_weather: {
        pre_process: function(action, conversation, user) {
            var weather = util.object.get(user, 'results.weather_forecast'),
                vote_time = util.object.get(user, 'settings.vote_time'),
                timezone = util.object.get(user, 'settings.timezone');

            var vote_time_local = moment.tz(vote_time, timezone);

            if (weather) {
                switch(weather.simple_text) {
                    case 'sunny':
                    case 'clear':
                    case 'mostlysunny':
                        weather.action = 'so bring your shades!';
                        weather.action_emoji = '\u{1F576}';
                        weather.time_dependent = true;
                        break;
                    case 'fog':
                    case 'haze':
                        weather.action = 'so bring a jacket!';
                        weather.action_emoji = '\u{1F301}'; // not actually a jacket emoji, foggy city
                        weather.time_dependent = false;
                        break;
                    case 'sleet':
                    case 'snow':
                    case 'flurries':
                        weather.action = 'so wear boots!'; // alt, build a snowman? or bring a sled? bring your sled dogs!
                        weather.action_emoji = '\u{26F8}';
                        weather.time_dependent = false;
                        break;
                    case 'rain':
                    case 'tstorm':
                        weather.action = 'so bring an umbrella!';
                        weather.action_emoji = '\u{2614}'
                        weather.time_dependent = false;
                        break;
                    default:
                        weather.action = '';
                        weather.action_emoji = '';
                        weather.time_dependent = false;
                }

                var msg = "OK! I'll send you a reminder at {{vote_time_local}} with directions.";

                if (us_election.is_election_day())
                    msg += ' ' + l10n('msg_help_line', conversation.locale);

                if (
                    (vote_time_local.hour() > 18 && weather.time_dependent)
                    ||                    
                    weather.condition == 'unknown'
                    ) {
                    log.info('bot: gotv: hour is after 6pm');
                    var msg2 = null;
                } else if (vote_time_local.hour() < 9) {
                    var msg2 = 'That\'s so early, bring some \u{2615}';
                } else {
                    var msg2 = "It should be {{weather.adjective}} {{weather.emoji}} {{weather.action}} {{weather.action_emoji}}";
                }

                var data = {
                    vote_time_local: moment.tz(user.settings.vote_time, 'UTC').tz(user.settings.timezone).format('LT'),
                    weather: weather
                };

                Promise.delay(convo_model.default_delay(conversation))
                    .then(function() {
                        if (msg2)
                            message_model.create(
                                config.bot.user_id,
                                conversation.id,
                                {body: language.template(msg2, data)}
                            );
                    });

                return {
                    msg: language.template(msg, data),
                    next: 'share_weather',
                    delay: 3000
                };
            } else {
                var msg = "OK! I'll send you a reminder at {{vote_time_local}} with directions. ";

                var data = {
                    vote_time_local: moment.tz(user.settings.vote_time, 'UTC').tz(user.settings.timezone).format('LT')
                };

                return {
                    msg: language.template(msg, data),
                    next: 'share_weather',
                    delay: 3000
                };
            }

            log.info('bot: gotv: schedule_weather', data);
        },
    },
    share_weather: {
        pre_process: function(action, conversation, user) {
            return {switch_chain: 'share'};
            var share_msg = "Help your friends get to the polls by making sure they know the weather too. "+
            "Share on Facebook http://fftf.io/hellovote_weather or forward this to them: "

            if (util.object.get(user, 'results.weather_forecast')) {
                var fwd_msg = "Hey, it's going to be {{results.weather_forecast.adjective}} on election day in {{settings.state}}. "+
                "This bot can share voting day weather forecasts and other voting info to help you vote too: http://hellovote.org";
            } else {
                var fwd_msg = "This bot can share voting day weather forecasts and other voting info to help you vote too: http://hellovote.org";   
            }

            // send our share msg immediately
            message_model.create(config.bot.user_id, conversation.id, {body: share_msg});
            // and delay forward message
            return {'next': 'final',
                    'msg': fwd_msg,
                    'delay': convo_model.default_delay(conversation),
                };
        }
    },
    zip: {
        process: bot_model.simple_store('user.settings.zip', {validate: validate.zip})
    },
    city: {
        pre_process: function(action, conversation, user) {
            if(util.object.get(user, 'settings.city')) return {next: 'state'};
        },
        process: bot_model.simple_store('user.settings.city', {validate: validate.city})
    },
    state: {
        pre_process: function(action, conversation, user) {
            return this.check_state(user);
        },
        check_state: function(user) {
            var state = util.object.get(user, 'settings.state');
            if (state) {
                return {next: 'address'};
            }
        },
        process: bot_model.simple_store('user.settings.state', {validate: validate.state}),
        post_process: function(user, conversation) {
            // need to also check state here, in case we didn't short circuit with pre_process
            return this.check_state(user);
        },
    },
    address: {
        pre_process: function(action, conversation, user) {
            if (user_model.use_notify(user.username)) { notify.add_tags(user, [user.settings.state.toUpperCase()]); }
        },
        process: bot_model.simple_store('user.settings.address', {validate: validate.address, advance: true}),
        post_process: function(user, conversation) {

            if (util.object.get(user, 'settings.address_appears_bogus')) {
                var err_meta = {
                    address: util.object.get(user, 'settings.address'),
                    zip: util.object.get(user, 'settings.zip'),
                    user_id: user.id.toString()
                }
                log.notice('bot: gotv_1: ADDRESS WARNING', err_meta);
                return {msg: l10n('msg_address_appears_bogus', conversation.locale)};
            } else {
                return {}
            }
        }
    },
    first_name: {
        process: function(body, user, step, conversation) {
            if (language.is_yes(body.trim())) {
                return Promise.resolve({
                    next: 'first_name',
                    msg: l10n('error_first_name', conversation.locale)
                });
            } else if (body.trim().toLowerCase().indexOf('woltato') > -1) {
                return Promise.resolve({
                    switch_chain: 'gotv_2'
                });
            } else if (body.trim().toLowerCase().indexOf('trolalor') > -1) {
                return Promise.resolve({
                    switch_chain: 'gotv_3'
                });
            } else {
                return Promise.resolve({
                    next: 'intro',
                    no_msg: true,
                    store: { 'user.first_name': body.trim() },
                    advance: true
                });
            }
        },
    },
    prompt_for_voted: {
        name: 'prompt_for_voted',
        msg: '',
        no_msg: true,
        pre_process: function(action, conversation, user) {
            return {
                msg: l10n('msg_help_line', conversation.locale) + '\n' + l10n('prompt_for_voted', conversation.locale)
            }
        },
        process: function(body, user, step, conversation) {
            if (
                body.toLowerCase().indexOf('already') > -1
                ||
                body.toLowerCase().indexOf('voted') > -1
                ) {
                return Promise.resolve({switch_chain: 'i_voted'})
            }
            return Promise.resolve({switch_chain: 'share'})
        }
    }
}
