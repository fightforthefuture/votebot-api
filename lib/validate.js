// validation functions for message body, user optional
// should return a Promise([]), or data_error
var Promise = require('bluebird');
var moment = require('moment');
var language = require('../lib/language');
var log = require('../lib/logger');
var l10n = require('../lib/l10n');
var phone = require('phone');
var street_address_model = require('../models/street_address');
var us_licenses = require('../lib/us_licenses');
var us_states = require('../lib/us_states');
var us_elections = require('../lib/us_election');
var util = require('../lib/util');
var zip_model = require('../models/zip');
var emailValidator = require("email-validator");

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

// override moment's default two-year digit parsing
// they assume everything before 68 is 2068! not good for birthdates
// we'll assume everything after 17 is 19xx, otherwise y2k
moment.parseTwoDigitYear = function (input) {
    return +input + (+input > 17 ? 1900 : 2000);
};

exports.date = function(body, user, locale)
{
    // moment with multiple parsers prefers formats earlier in the list
    var formats = [ "MM/DD/YYYY", "MM/DD/YY", "MM DD YY",  "MM-DD-YY", "MM-DD-YYYY", "MMMM DD YYYY", "MMMM DD, YYYY",  // american month-date
                    "DD-MM-YYYY", "DD/MM/YYYY", "DD MMMM YYYY", "DD MMMM, YYYY", "DD MMMM YY"]  // european date-month
    var date = new moment(body, formats);

    if (date.isValid()) {
        // store as ISO formatted YYYY-MM-DD
        return Promise.resolve([date.format('YYYY-MM-DD')]);
    } else {
        return Promise.reject(data_error(l10n('error_validate_date', locale)));
    }
};

exports.date_interval = function(body, user, locale) {

}

exports.phone = function(body, options, locale) {
    options || (options = {});
    parsed_phone = phone(body, options.country)[0];
    if (parsed_phone) {
        return Promise.resolve([parsed_phone]);
    } else {
        return data_error(l10n('error_validate_phone', locale));
    }
}

exports.email = function(body, user, locale)
{
    // TODO, don't let user skip if email is required
    if (body.trim().toUpperCase() === 'SKIP') {
        return Promise.resolve([null]);
    }
    // var valid_email = body.indexOf('@') > 0; // really really simple email validation

    var valid_email = emailValidator.validate(body.trim());
    if(valid_email) return Promise.resolve([body.trim()]);
    return data_error(l10n('error_validate_email', locale), {promise: true});
}

exports.boolean = function(body, user, locale)
{
    return Promise.resolve([!!language.is_yes(body)]);
}

exports.boolean_yes = function(body, user, locale)
{
    return Promise.resolve([language.is_yes(body), language.is_no(body)])
        .spread(function(is_yes, is_no) {
            if(!is_yes && !is_no) throw data_error(l10n('error_validate_boolean_yes', locale));
            if(!is_yes) throw data_error(l10n('warning_validate_boolean_yes', locale), {end: true});
            return [true];
        })
}

exports.boolean_no = function(body, user, locale)
{
    return Promise.resolve([language.is_yes(body), language.is_no(body)])
        .spread(function(is_yes, is_no) {
            if(!is_yes && !is_no) throw data_error(l10n('error_validate_boolean_yes', locale));
            if(!is_no) throw data_error(l10n('warning_validate_boolean_no', locale), {end: true});
            return [false];
        })
}

exports.city = function(body, user, locale)
{
    if (body.indexOf(',') > 0) {
        // they've entered City, ST
        var parts = body.trim().split(',')
        city = parts[0];
        state = parts[1].trim();
        setter = {'user.settings.state': state};
        return Promise.resolve([city, setter]);
    } else {
        return Promise.resolve([body.trim()]);
    }
}

exports.us_state = function(body, user, locale)
{
    var state = body.trim().toUpperCase();
     if (!state || state === 'NONE' || state == 'NO') {
        return Promise.resolve([false]);
    }
    if (state.length === 2) {
        if(!us_states.valid_abbreviation(state)) {
            return Promise.reject(data_error(l10n('error_validate_state_abbreviation', locale)));
        }
        return Promise.resolve([state]);
    } else {
        if(!us_states.valid_name(state)) {
            return Promise.reject(data_error(l10n('error_validate_state_name', locale)));
        }
        return Promise.resolve([us_states.name_to_abbr(state)]);
    }
}

exports.zip = function(body, user, locale)
{
    if (body.trim().toUpperCase() === 'SKIP') {
        return Promise.resolve([null]);
    }

    var zip = body.replace(/-.*/, '').trim();
    if(!zip.match(/^[0-9]{5}$/)) return Promise.reject(data_error(l10n('error_validate_zip', locale)));
    return zip_model.find(zip)
        .then(function(zipdata) {
            var zip = zipdata.code;
            if(!zip) return reject(data_error(l10n('error_validate_zip_is_bogus', locale)));

            var places = zipdata.places;
            var setter = {};
            // if we have 0 (or 2 or more) places, we cannot assume a location,
            // so we only populate the city/state fields if we get one location
            if(places.length > 0)
            {
                var place = places[0];
                var state = place.state;
                var city = place.city;
                if(state) setter['user.settings.state'] = state;

                if(places.length == 1) {
                    if(city) setter['user.settings.city'] = city;
                } else {
                    setter['user.settings.city'] = false;
                }
            }
            return [zip, setter];
        })
        .catch(function(err) { return err && err.message == 'not_found'; }, function(err) {
            throw data_error(l10n('error_validate_zip_is_bogus', locale));
        });
}

exports.address = function(body, user, locale)
{
    var address = body.trim();
    if (!address || address.toUpperCase() === 'NONE') {
        throw data_error(l10n('error_validate_address', locale));
    }
    return street_address_model.validate(address, user.settings.city, user.settings.state, user.settings.zip ? user.settings.zip : null)
        .then(function(address_data) {
            var setter = {
                'user.settings.address_appears_bogus': false
            };

            // re-assemble from components
            var valid_address = exports.massage_street_address(address_data);
            setter['user.settings.address'] = valid_address;
            setter['user.settings.street_name'] = address_data.components.street_name;

            // overwrite earlier city/state, in case full address was more specific
            setter['user.settings.city'] = address_data.components.city_name;
            setter['user.settings.state'] = address_data.components.state_abbreviation;
            setter['user.settings.zip'] = address_data.components.zipcode;

            // save county, which some states need
            setter['user.settings.county'] = address_data.metadata.county_name;

            // save timezone, for local time notifications
            setter['user.settings.timezone'] = address_data.metadata.timezone;

            if (address_data.analysis.footnotes && address_data.analysis.footnotes.match('H#')) {
                // Address is valid but it also needs a secondary number (apartment, suite, etc.)
                setter['user.settings.address_needs_apt'] = true;
            } else {
                setter['user.settings.address_needs_apt'] = false;
            }

            return [valid_address, setter];
        })
        .catch(function(err) { return err && err.message == 'not_found'; }, function(err) {
            return [body, {
                'user.settings.address_needs_apt': true,
                'user.settings.address_appears_bogus': true
            }];
            // JL NOTE ~ bypassing SmartyStreets requirement
            // throw data_error(l10n('error_validate_address_is_bogus', locale));
        });
}

exports.massage_street_address = function(address_data, options) {
    options || (options = {});

    var valid_address = address_data.components.primary_number
        + (address_data.components.street_predirection ? ' ' + address_data.components.street_predirection : '')
        + ' ' + address_data.components.street_name
        + (address_data.components.street_suffix ? ' ' + address_data.components.street_suffix : '');

    if (address_data.components.street_postdirection) {
        valid_address += ' ' + address_data.components.street_postdirection;
    }

    if (address_data.components.secondary_number && !options.omit_apartment) {
        valid_address += ' ' + address_data.components.secondary_designator
                + ' ' + address_data.components.secondary_number;
    }
    return valid_address;
}

exports.address_unit = function(body, user, locale)
{
    // validate unit number against smarty streets
    var unit = body.trim();

    var bail = function() {
        return [unit, {}];
    }

    if (unit.toLowerCase() == 'none')
        return Promise.resolve([null, {}]);

    return street_address_model.validate(user.settings.address+' '+unit, user.settings.city, user.settings.state)
        .then(function(address_data) {
            var setter = {};

            try {

                if (address_data.components.secondary_number) {
                    valid_unit = address_data.components.secondary_designator
                         + ' ' + address_data.components.secondary_number;
                }
                setter['user.settings.address_unit'] = valid_unit;

                if (address_data.analysis.footnotes && address_data.analysis.footnotes.match('S#')) {
                    // The secondary information (apartment, suite, etc.) does not match that on the national ZIP+4 file.
                    setter['user.settings.address_needs_apt'] = true;
                    setter['user.settings.address_unit'] = null;
                    // throw data_error(l10n('error_validate_apartment', locale));
                    return bail();
                }

                return [unit, setter];
            } catch(err) {

                log.info('validate: address_unit error. oh well...');

                return bail();
            }
        })
        .catch(function(err) { return err && err.message == 'not_found'; }, function(err) {
            return bail();
            // JL NOTE ~ bypassing SmartyStreets requirement
            //throw data_error(l10n('error_validate_address_is_bogus', locale));
        });
}

exports.gender = function(body, user, locale)
{
    return Promise.resolve([language.get_gender(body)])
        .tap(function(gender) {
            if(!gender) throw data_error(l10n('error_validate_gender', locale));
        });
}

exports.military_or_overseas = function(body, user, locale)
{
    return Promise.resolve([language.military_or_overseas(body), language.is_no(body)])
        .spread(function(military_or_overseas, is_no) {
            if(military_or_overseas) { return [military_or_overseas]; }
            if(is_no) { return [false]; }
            else { throw data_error(l10n('error_validate_military_or_overseas', locale)); }
        });
}

exports.ssn = function(body, user, locale)
{
    var ssn = body.match(/[0-9]{3}-?[0-9]{2}-?[0-9]{4}/);
    if(ssn && ssn[0]) return Promise.resolve([ssn[0]]);
    return data_error(l10n('error_validate_ssn', locale), {promise: true});
}

exports.ssn_last4 = function(body, user, locale)
{
    var ssn = body.match(/[0-9]{4}/);
    if(ssn && ssn[0]) return Promise.resolve([ssn[0]]);
    return data_error(l10n('error_validate_ssn_last4', locale), {promise: true});
}

exports.state_id_number = function(body, user, locale)
{
    if (body.trim().toUpperCase() === 'NONE') {
        return Promise.resolve([false]);
    }

    var state = util.object.get(user, 'settings.state');
    var id_number = body.trim();
    id_number = id_number.replace(/[- ]/g, ''); // clean dashes or spaces
    if (state) {
        var state_id = us_licenses.validate(state, id_number);
        if (!state_id && !us_elections.state_required_questions[state]) {
            // if not in an OVR state, accept us passport or card
            state_id = us_licenses.validate('US', id_number);
        }
    } else {
        // most permissive
        var state_id = id_number.match(/[\d\w]{1,13}/);
    }
    if(state_id && state_id[0]) return Promise.resolve([state_id[0]]);
    return data_error(language.template(l10n('error_validate_state_id_number', locale), user), {promise: true});
}

exports.political_party = function(body, user, locale)
{
    var party = body.trim().toLowerCase();

    if (party === 'none') {
        return Promise.resolve(['none']); // really, the text none
    }

    // match national parties from prompt
    var national_party = party.match(/(democrat|republican|libertarian|green)/)
    if (national_party) {
        return Promise.resolve([national_party[0]]);
    }

    // if other, prompt for it
    if (party === 'other') {
        return data_error(language.template(l10n('prompt_other_political_designation', locale), user), {promise: true});
    }

    return Promise.resolve(['none']);

    // TODO, multiple languages?
}

// abuse the validation to let user reset settings
// and return an empty object
exports.empty_object = function(body, user, locale)
{
    return Promise.resolve([{}]);
}

exports.always_true = function(body, user, locale)
{
    return Promise.resolve([true]);
}
