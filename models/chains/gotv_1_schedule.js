var log = require('../../lib/logger');
var language = require('../../lib/language');
var polling_place_model = require('../polling_place');
var weather_report_model = require('../weather_report');
var user_model = require('../user');

var moment = require('moment');
var parse_messy_time = require('parse-messy-time');
var google_url = require('google-url');
var emojiweather = require('emojiweather');


module.exports = {
    intro: {
        process: function() {
            log.info('bot: gotv 1: intro');
            return Promise.resolve({'next': 'schedule_polling_place'})
        }
    },
    schedule_polling_place: {
        pre_process: function(action, conversation, user) {
            log.info('bot: gotv: looking up polling place info');

            var polling_place = polling_place_model.lookup(user.settings.address, user.settings.city, user.settings.state);
            var gttp_link = "https://gttp.votinginfoproject.org/#"+
                encodeURIComponent(user.settings.address+' '+user.settings.city+' '+user.settings.state);

            var msg = "Hey {{first_name}}, it's HelloVote! Election day is tomorrow! "+
            "Your polling place is at {{results.polling_place.address.locationName}} in {{results.polling_place.address.city}}.\n{{results.polling_place.link}}\n"+
            "What time will you vote?";

            return {msg: language.template(msg, user)}
        },
        process: function(body, user, step, conversation) {
            var vote_time = parse_messy_time.parse(body.trim());
            // TODO, schedule new conversation to trigger just before parsed vote_time

            var update_user = util.object.set(user, 'vote_time', vote_time);
            user_model.update(user.id, update_user);

            return Promise.resolve({next: 'schedule_weather'})
        }
    },
    schedule_weather: {
        pre_process: function(action, conversation, user) {
            log.info('bot: gotv: looking up weather');

            // weather lookup
            // TODO, calculate days_out from vote_time minus current_time
            var weather_report = weather_report_model.forecast_day(user.settings.city, user.settings.state);
            weather_report.icon = weather_report.icon.replace('chance', '') // no room for uncertainty
                                                     .replace('tstorms', 'tstorm'); // normalize for emojiweather

            var weather = { conditions: weather_report.Condition.text.toLowerCase() };
            weather.emoji = emojiweather(weather.conditions);

            switch(weather_report.icon) {
                case 'sunny':
                case 'clear':
                case 'mostlysunny':
                    weather.action = 'bring your shades';
                    weater.action_emoji = '\u{1F576}';
                    break;
                case 'fog':
                case 'haze':
                    weather.action = 'bring a jacket';
                    weater.action_emoji = '\u{1F301}'; // not actually a jacket emoji, foggy city
                    break;
                case 'sleet':
                case 'snow':
                case 'flurries':
                    weather.action = 'bring your skates'; // alt, build a snowman?
                    weater.action_emoji = '\u{26F8}';
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
            "It might be {{weather.conditions}} {{weather.emoji}} so {{weather.action}}! {{weather.action_emoji}} "+
            "Click here to tell friends you'll be voting! {{share_link}}";

            var data = {
                vote_time: moment(user.settings.vote_time).format('L'),
                weather: weather,
                share_link: 'https://fftf.io/hellovote_gotv'
            };

            return {msg: language.template(msg, data), next: 'share_weather', advance: true};
        },
    },
    share_weather: {
        pre_process: function(action, conversation, user) {
            var share_msg = "Help your friends get to the polls by making sure they know the weather too. "+
            "Share on Facebook hello or forward this to them: "
            var fwd_msg = "Hey, it's going to be {{weather.conditions}} on election day in {{settings.state}}."+
            "This bot can share voting day weather forecasts and other voting info to help you vote too: http://hellovote.org";


        }
    },
}