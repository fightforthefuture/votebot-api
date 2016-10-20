var log = require('../../lib/logger');
var language = require('../../lib/language');
var polling_place_model = require('../polling_place');
var user_model = require('../user');

var moment = require('moment');
var parse_messy_time = require('parse-messy-time');
var google_url = require('google-url');


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

            return Promise.resolve({next: 'vote_time_confirm'})
        }
    },
    schedule_time_confirm: {
        pre_process: function(action, conversation, user) {
            log.info('bot: gotv: looking up weather');

            // TODO, weather lookup
            // TODO, emoji translate

            var msg = "Okay great. I'll send you a reminder at {{vote_time}} with directions. "+
            "It might be {{weather_status}} so {{weather_action}}! {{weather_emoji}} "+
            "Click here to tell friends you'll be voting! {{share_link}}";

            var data = {
                vote_time: moment(user.settings.vote_time).format('L'),
                weather_status: weather
            };

            return {msg: language.template(msg, data)};
        },
        process: function(body, user, step, conversation) {

            return Promise.resolve({next: 'share_weather'})
        }
    },
    share_weather: {
        pre_process: function(action, conversation, user) {
            var share_msg = "Help your friends get to the polls by making sure they know the weather too. "+
            "Share on Facebook hello or forward this to them: "
            var fwd_msg = "Hey, it's going to be [rainy] on election day in {{settings.state}}."+
            "This bot can share voting day weather forecasts and other voting info to help you vote too: http://hellovote.org";


        }
    },
}