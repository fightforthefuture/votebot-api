// validation functions for message body, user optional
// should return a Promise([]), or data_error
var Promise = require('bluebird');
var moment = require('moment');
var language = require('../lib/language');
var log = require('../lib/logger');
var street_address_model = require('../models/street_address');
var us_licenses = require('../lib/us_licenses');
var us_states = require('../lib/us_states');
var util = require('../lib/util');
var zip_model = require('../models/zip');

// a useful helper for creating "data errors" ie, the code is fine, but some
// kind of issue exists in the data the user handed us for validation
exports.data_error = function(msg, options)
{
    options || (options = {});

    var err = new Error(msg);
    err.data_error = true;
    if(options.promise) err = Promise.reject(err);
    // this conversation.......is over
    if(options.end) err.end_conversation = true;
    return err;
}
data_error = exports.data_error;

exports.date = function(body)
{
    // moment with multiple parsers prefers formats earlier in the list
    var formats = [ "MM/DD/YYYY", "MMMM/DD/YYYY", "MM-DD-YYYY", "MMMM DD YYYY", "MMMM DD, YYYY", "MM DD YY",  // american month-date
                    "DD-MM-YYYY", "DD/MM/YYYY", "DD MMMM YYYY", "DD MMMM, YYYY", "DD MMMM YY"]  // european date-month
    var date = new moment(body, formats);

    if (date.isValid()) {
        // store as ISO formatted YYYY-MM-DD
        return Promise.resolve([date.format('YYYY-MM-DD')]);
    } else {
        return Promise.reject(data_error('That\'s not a valid date. Please format like MM/DD/YYYY'));
    }
};

exports.date_interval = function(body) {

}

exports.email = function(body)
{
    // TODO, don't let user skip if email is required
    if (body.trim().toUpperCase() === 'SKIP') {
        return Promise.resolve([null]);
    }
    var valid_email = body.indexOf('@') > 0; // really really simple email validation
    if(valid_email) return Promise.resolve([body.trim()]);
    return data_error('We need your email address to send you a registration receipt and voting reminders. If you don\'t have one, reply NONE.', {promise: true});
}

exports.boolean = function(body)
{
    return Promise.resolve([!!language.is_yes(body)]);
}

exports.boolean_yes = function(body)
{
    return Promise.resolve([language.is_yes(body), language.is_no(body)])
        .spread(function(is_yes, is_no) {
            if(!is_yes && !is_no) throw data_error('Please answer yes or no');
            if(!is_yes) throw data_error('Are you sure? If you don\'t answer "yes", you can\'t register to vote in your state.', {end: true});
            return [true];
        })
}

exports.boolean_no = function(body)
{
    return Promise.resolve([language.is_yes(body), language.is_no(body)])
        .spread(function(is_yes, is_no) {
            if(!is_yes && !is_no) throw data_error('Please answer yes or no');
            if(!is_no) throw data_error('Are you sure? If you don\'t answer "no", you can\'t register to vote in your state.', {end: true});
            return [false];
        })
}

exports.us_state = function(body)
{
    var state = body.trim();
    if (state.length === 2) {
        if(!us_states.valid_abbreviation(state)) {
            return Promise.reject(data_error('That\'s not a valid state abbreviation. Please enter only 2 letters.'));
        }
        return Promise.resolve([state]);
    } else {
        if(!us_states.valid_name(state)) {
            return Promise.reject(data_error('That\'s not a valid state name.'));
        }
        return Promise.resolve([us_states.name_to_abbr(state)]);
    }
}

exports.zip = function(body)
{
    if (body.trim().toUpperCase() === 'SKIP') {
        return Promise.resolve([null]);
    }

    var zip = body.replace(/-.*/, '');
    if(!zip.match(/^[0-9]{5}$/)) return Promise.reject(data_error('That\'s not a valid zip code. Please enter only 5 numbers.'));
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
}

exports.address = function(body, user)
{
    var address = body.trim();
    if (!address || address.toUpperCase() === 'NONE') {
        throw data_error('Please enter your mailing address.');
    }
    return street_address_model.validate(address, user.settings.city, user.settings.state)
        .then(function(address_data) {
            var setter = {};

            // re-assemble from components
            var valid_address = address_data.components.primary_number
                        + ' ' + address_data.components.street_name
                        + ' ' + address_data.components.street_suffix;
            if (address_data.components.secondary_number) {
                valid_address += address_data.components.secondary_designator
                        + ' ' + address_data.components.secondary_number;
            }
            setter['user.settings.address'] = valid_address;

            // overwrite city/state from zippopotamus, in case smartystreets was more specific
            setter['user.settings.city'] = address_data.components.city_name;
            setter['user.settings.state'] = address_data.components.state_abbreviation;
            setter['user.settings.zip'] = address_data.components.zipcode;

            // save county, which some states need
            setter['user.settings.county'] = address_data.metadata.county_name;

            // save timezone offset, in case we do local time notifications
            setter['user.settings.utc_offset'] = address_data.metadata.utc_offset;

            if (address_data.analysis.footnotes.indexOf('N1') > 0) {
                // Address is valid but it also needs a secondary number (apartment, suite, etc.)
                setter['user.settings.address_needs_apt'] = true;
            }

            return [valid_address, setter];
        })
        .catch(function(err) { return err && err.message == 'not_found'; }, function(err) {
            throw data_error('We couldn\'t find that street address. Please try again.');
        });
}

exports.address_unit = function(body, user)
{
    // validate unit number against smarty streets
    var unit = body.trim();
    return street_address_model.validate(user.settings.address+' '+unit, user.settings.city, user.settings.state)
        .then(function(address_data) {
            var setter = {};

            if (address_data.components.secondary_number) {
                valid_unit = address_data.components.secondary_designator
                     + ' ' + address_data.components.secondary_number;
            }
            setter['user.settings.address_unit'] = valid_unit;

            if (address_data.analysis.footnotes.indexOf('S#') > 0) {
                // The secondary information (apartment, suite, etc.) does not match that on the national ZIP+4 file.
                setter['user.settings.address_needs_apt'] = true;
                setter['user.settings.address_unit'] = null;
                throw data_error('We couldn\'t validate that apartment number. Please try again.');
            }

            return [unit, setter];
        })
        .catch(function(err) { return err && err.message == 'not_found'; }, function(err) {
            throw data_error('We couldn\'t find that street address. Please try again.');
        });
}

exports.gender = function(body)
{
    return Promise.resolve([language.get_gender(body)])
        .tap(function(gender) {
            if(!gender) throw data_error('Please enter your gender as male or female');
        });
}

exports.ssn = function(body)
{
    var ssn = body.match(/[0-9]{3}-?[0-9]{2}-?[0-9]{4}/);
    if(ssn && ssn[0]) return Promise.resolve([ssn[0]]);
    return data_error('Please enter your SSN like 123-45-6789', {promise: true});
}

exports.ssn_last_4 = function(body)
{
    var ssn = body.match(/[0-9]{4}/);
    if(ssn && ssn[0]) return Promise.resolve([ssn[0]]);
    return data_error('Please enter just the last 4 digits of your SSN', {promise: true});
}

exports.state_id = function(body, user)
{
    if (body.trim().toUpperCase() === 'NONE') {
        return Promise.resolve(['NONE']); // really, the text NONE is what vote.org wants
    }

    var state = util.object.get(user, 'settings.state');
    var id_number = body.trim();
    if (state) {
        var state_id = us_licenses.validate(state, id_number);
    } else {
        // most permissive
        var state_id = id_number.match(/[\d\w]{1,13}/);
    }
    if(state_id && state_id[0]) return Promise.resolve([state_id[0]]);
    return data_error(language.template('Please enter a valid {{setttings.state}} ID. If you don\'t have one, we can\'t submit your registration. Reply NONE and we\'ll send you a form to print and mail.', user), {promise: true});
}

// abuse the validation to let user reset settings
// and return an empty object
exports.empty_object = function(body)
{
    return Promise.resolve([{}]);
}

exports.always_true = function(body)
{
    return Promise.resolve([true]);
}

// vote_1 chain specific validations
exports.voter_registration_complete = function(user_settings) {
    var state = util.object.get(user_settings, 'state');
    var state_fields = us_states.required_questions[state] || us_states.required_questions_default;

    // remove skippable fields from required_questions
    var skippable_fields = ['state_id', 'ssn_last_4', 'ssn', 'consent_use_signature', 'email'];
    var required_fields = state_fields.filter(function(f) { return (skippable_fields.indexOf(f) > 0); })

    var missing_fields = [];
    missing_fields = required_fields.map(function(f) {
        if (!util.object.get(user_settings, f)) {
            return f;
        }
    });
    if (missing_fields.length) {
        log.error('user missing fields!', user_settings, missing_fields);
        return Promise.reject(data_error('You are missing: '+missing_fields.join(', ')));
    }
    return Promise.resolve([true]);
}

exports.submit_response = function(body, user)
{
    var submit_response = util.object.get(user, 'settings.submit');
    console.info('validate submit_response', submit_response)
    // TODO, check for errors in response from votebot-forms

    return Promise.resolve([true]);
}
