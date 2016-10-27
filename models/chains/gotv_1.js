var config = require('../../config');
var log = require('../../lib/logger');
var language = require('../../lib/language');
var l10n = require('../../lib/l10n');
var util = require('../../lib/util');
var validate = require('../../lib/validate');

var bot_model = require('../bot');
var polling_place_model = require('../polling_place');
var weather_model = require('../weather_report');
var user_model = require('../user');
var message_model = require('../message');
var notify = require('../notify.js');
var convo_model = require('../conversation');
var shorten = require('../../lib/shortener');

var moment = require('moment');
var momentTZ = require('moment-timezone');
var timezone_model = require('../timezone');
var parse_messy_time = require('parse-messy-time');

module.exports = {
    intro: {
        process: function(body, user, step, conversation) {
            log.info('bot: gotv 1: intro');
            if (!util.object.get(user, 'first_name')) {
                return Promise.resolve({'next': 'first_name'});
            };
            if (!util.object.get(user, 'settings.zip')) {
                return Promise.resolve({'next': 'zip'});
            };
            if (!util.object.get(user, 'settings.address')) {
                return Promise.resolve({'next': 'address'});
            };

            log.info('bot: gotv: looking up polling place info');

            return polling_place_model.lookup(user.settings.address, user.settings.city, user.settings.state)
            .then(function(polling_place) {
                var gttp_link = "https://gttp.votinginfoproject.org/#"+
                    encodeURIComponent(user.settings.address+' '+user.settings.city+' '+user.settings.state);
                return shorten(gttp_link).then(function(short_link) {
                    polling_place.link = short_link;
                    var update_user = util.object.set(user, 'results.polling_place', polling_place);
                    return user_model.update(user.id, update_user).then(function() {
                        return Promise.resolve({'next': 'schedule_vote_time'});
                    });
                });
            }).catch(function(error) {
                log.error('shorten_url error', error);
                return Promise.resolve({'next': 'schedule_vote_time'});
            });
        }
    },
    schedule_vote_time: {
        pre_process: function(action, conversation, user) {
            // TODO, convert election_day offset to human time
            // so we don't assume it's "tomorrow"

            var msg = '';
            if (user.first_name) {
                var msg = "Hey {{first_name}},";
            }
            msg = msg + ' ' + l10n('msg_election_day_tomorrow', conversation.locale);

            if (util.object.get(user, 'results.polling_place.address')) {
                msg = msg + ' ' +l10n('msg_polling_place', conversation.locale);
            } else {
                msg = msg + ' ' + l10n('msg_lookup_polling_place', conversation.locale);
            }
            msg = msg + ' ' + l10n('prompt_schedule_vote_time', conversation.locale);

            return {msg: language.template(msg, user)}
        },
        process: function(body, user, step, conversation) {
            // use parse_messy_time to turn human strings into date object
            var parsed_local_time = parse_messy_time(body.trim());
            // unfortunately it doesn't throw error if it can't parse, just returns midnight
            if (!parsed_local_time.getHours() && !parsed_local_time.getMinutes()) {
                return validate.data_error(step.errormsg, {promise: true});
            }

            if (parsed_local_time.getHours() < 7 && body.toUpperCase().indexOf('AM') < 0) {
                return validate.data_error('Did you really mean '+parsed_local_time.getHours()+'AM? Please enter the time with AM/PM', {promise: true});
            }
            log.info('bot: gotv: parsed local time '+moment(parsed_local_time).format());

            // look up local city timezone
            log.info('bot: gotv: looking up timezone');
            return timezone_model.from_zipcode(user.settings.zip).then(function(local_tz_name) {
                 // convert user local time to UTC on election day
                var election_day = moment(config.election.date, 'YYYY-MM-DD');
                log.info('bot: gotv: election day is '+election_day.format('L'));
                var vote_time_local = moment(parsed_local_time).tz(local_tz_name)
                    .set({year:election_day.year(), month:election_day.month(), day:election_day.day()});
                log.info('bot: gotv: user will vote at '+vote_time_local.format());

                // schedule gotv_3 chain to trigger 30 min before vote_time_schedule_utc
                var vote_time_utc = vote_time_local.clone().tz("UTC");
                var vote_time_schedule_utc = vote_time_utc.subtract(30, 'minutes');
                log.info('bot: gotv: scheduled govt_3 for '+vote_time_schedule_utc.format('LT L Z'));

                // store timezone name and UTC times to user
                var update_user = util.object.set(user, 'settings.timezone', local_tz_name);
                var update_user = util.object.set(update_user, 'settings.vote_time', vote_time_utc.format());
                var update_user = util.object.set(update_user, 'settings.vote_time_schedule', vote_time_schedule_utc.format());

                // look up weather for next step in process, bc we can't do async in pre_process  
                // calculate days_out from vote_time on election_day minus current_time
                var now = moment();
                var days_out = election_day.diff(now, 'days');
                log.info('bot: gotv: looking up weather '+days_out+' days out');
                return weather_model.forecast(user.settings.city, user.settings.state, days_out).then(function(forecast) {
                    update_user = util.object.set(update_user, 'results.weather_forecast', forecast);
                    return user_model.update(user.id, update_user).then(function() {
                        return Promise.resolve({next: 'schedule_weather'});
                    });
                }).catch(function(weather_error) {
                    log.error('bot: gotv: unable to look up weather for '+user.settings.city+' '+user.settings.state);
                    return user_model.update(user.id, update_user).then(function() {
                        return Promise.resolve({next: 'schedule_weather'});
                    });
                });
            }).catch(function(tz_err) {
                return {next: 'zip'}
            });
        }
    },
    schedule_weather: {
        pre_process: function(action, conversation, user) {
            var weather = util.object.get(user, 'results.weather_forecast');
            if (weather) {
                switch(weather.simple_text) {
                    case 'sunny':
                    case 'clear':
                    case 'mostlysunny':
                        weather.action = 'bring your shades';
                        weather.action_emoji = '\u{1F576}';
                        break;
                    case 'fog':
                    case 'haze':
                        weather.action = 'bring a jacket';
                        weather.action_emoji = '\u{1F301}'; // not actually a jacket emoji, foggy city
                        break;
                    case 'sleet':
                    case 'snow':
                    case 'flurries':
                        weather.action = 'bring your skates'; // alt, build a snowman? or bring a sled? bring your sled dogs!
                        weather.action_emoji = '\u{26F8}';
                        break;
                    case 'rain':
                    case 'tstorm':
                        weather.action = 'bring an umbrella';
                        weather.action_emoji = '\u{2614}'
                        break;
                    default:
                        weather.action = 'get ready to vote';
                        weather.action_emoji = '\u{1F5F3}';
                }

                var msg = "Okay great. I'll send you a reminder at {{vote_time_local}} with directions. "+
                "It might be {{weather.adjective}} {{weather.emoji}} so {{weather.action}}! {{weather.action_emoji}}";

                var data = {
                    vote_time_local: moment(user.settings.vote_time).tz(user.settings.timezone).format('LT'),
                    weather: weather,
                    share_link: 'https://fftf.io/hellovote_gotv'
                };
            } else {
                var msg = "Okay great. I'll send you a reminder at {{vote_time_local}} with directions. "+
                "Click here to tell friends you'll be voting! {{share_link}}";

                var data = {
                    vote_time_local: moment(user.settings.vote_time).tz(user.settings.timezone).format('LT'),
                    share_link: 'https://fftf.io/hellovote_gotv'
                };
            }

            log.info('bot: gotv: schedule_weather', data);

            return {msg: language.template(msg, data), next: 'share_weather', delay: 3000};
        },
    },
    share_weather: {
        pre_process: function(action, conversation, user) {
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
                log.notice('bot: vote_1: ADDRESS WARNING', err_meta);
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
            } else {
                return Promise.resolve({
                    next: 'intro',
                    no_msg: true,
                    store: { 'user.first_name': body.trim() },
                    advance: true
                });
            }
        },
    }
}
