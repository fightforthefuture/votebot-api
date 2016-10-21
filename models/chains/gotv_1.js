var config = require('../../config');
var log = require('../../lib/logger');
var language = require('../../lib/language');
var polling_place_model = require('../polling_place');
var weather_model = require('../weather_report');
var user_model = require('../user');
var message_model = require('../message');
var convo_model = require('../conversation');
var short_url = require('../short_url');
var util = require('../../lib/util');
var moment = require('moment');
var parse_messy_time = require('parse-messy-time');
var emojiweather = require('emojiweather');


module.exports = {
    intro: {
        process: function(body, user, step, conversation) {
            log.info('bot: gotv 1: intro');
            if (!util.object.get(user, 'settings.address')) {
                
                // temp, fill in with testing data
                log.notice('GOTV_1 OPERATING WITH TEMP DATA');
                var update_user = util.object.set(user, 'settings', {
                    address: '1461 Alice St',
                    city: 'Oakland',
                    state: 'CA',
                });
                user.first_name = "Josh";
                user_model.update(user.id, update_user);

                //return Promise.resolve({'switch_chain': 'vote_1'})
            };

            log.info('bot: gotv: looking up polling place info');

            return polling_place_model.lookup(user.settings.address, user.settings.city, user.settings.state)
            .then(function(polling_place) {
                var gttp_link = "https://gttp.votinginfoproject.org/#"+
                    encodeURIComponent(user.settings.address+' '+user.settings.city+' '+user.settings.state);
                return short_url.shorten(gttp_link).then(function(short_link) {
                    polling_place.link = short_link;
                    var update_user = util.object.set(user, 'results.polling_place', polling_place);
                    return user_model.update(user.id, update_user).then(function() {
                        return Promise.resolve({'next': 'schedule_polling_place'});
                    });
                });
            });
        }
    },
    schedule_polling_place: {
        pre_process: function(action, conversation, user) {
            if (util.object.get(user, 'results.polling_place')) {
                var msg = "Hey {{first_name}}, it's HelloVote! Election day is tomorrow! "+
                "Your polling place is the {{results.polling_place.address.locationName}} in {{results.polling_place.address.city}}.\n{{results.polling_place.link}}\n"+
                "What time will you vote?";
            } else {
                 var msg = "Hey {{first_name}}, it's HelloVote! Election day is tomorrow! "+
                "What time will you vote?";
            }

            return {msg: language.template(msg, user)}
        },
        process: function(body, user, step, conversation) {
            var vote_time = parse_messy_time(body.trim());
            // TODO, schedule gotv_2 chain to trigger just before parsed vote_time

            var update_user = util.object.set(user, 'settings.vote_time', vote_time);

            // look up weather for next step in process, bc we can't do async in pre_process  
            // TODO, calculate days_out from vote_time minus current_time
            log.info('bot: gotv: looking up weather');
            return weather_model.forecast(user.settings.city, user.settings.state).then(function(forecast) {
                update_user = util.object.set(update_user, 'results.weather_forecast', forecast);
                return user_model.update(user.id, update_user).then(function() {
                    return Promise.resolve({next: 'schedule_weather'});
                });
            });
        }
    },
    schedule_weather: {
        pre_process: function(action, conversation, user) {
            var weather_forecast = util.object.get(user, 'results.weather_forecast');
            if (weather_forecast) {
                var weather = { adjective: weather_forecast.adjective };
                weather.emoji = emojiweather(weather_forecast.simple_text);

                switch(weather_forecast.simple_text) {
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

                var msg = "Okay great. I'll send you a reminder at {{vote_time}} with directions. "+
                "It might be {{weather.adjective}} {{weather.emoji}} so {{weather.action}}! {{weather.action_emoji}} "+
                "Click here to tell friends you'll be voting! {{share_link}}";

                var data = {
                    vote_time: moment(user.settings.vote_time).format('LT'),
                    weather: weather,
                    share_link: 'https://fftf.io/hellovote_gotv'
                };
            } else {
                var msg = "Okay great. I'll send you a reminder at {{vote_time}} with directions. "+
                "Click here to tell friends you'll be voting! {{share_link}}";

                var data = {
                    vote_time: moment(user.settings.vote_time).format('L'),
                    share_link: 'https://fftf.io/hellovote_gotv'
                };
            }

            return {msg: language.template(msg, data), next: 'share_weather', advance: true};
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
            return { 'next': 'final',
                    'msg': fwd_msg,
                    'delay': convo_model.default_delay(conversation),
                };
        }
    },
}
