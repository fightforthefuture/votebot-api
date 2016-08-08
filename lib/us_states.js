var util = require('../lib/util');

var state_hash = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AS": "American Samoa",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "DC": "District Of Columbia",
    "FM": "Federated States Of Micronesia",
    "FL": "Florida",
    "GA": "Georgia",
    "GU": "Guam",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MH": "Marshall Islands",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "MP": "Northern Mariana Islands",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PW": "Palau",
    "PA": "Pennsylvania",
    "PR": "Puerto Rico",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "UT": "Utah",
    "VT": "Vermont",
    "VI": "Virgin Islands",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming"
};
var state_abbrs = Object.keys(state_hash);
var state_names = state_abbrs.map(function(n) { return state_hash[n]; });
var state_names_upper = state_names.map(function(n) { return n.toUpperCase(); });
var state_hash_names = util.object.invert(state_hash);

exports.valid_abbreviation = function(abbr) {
    return abbr.toUpperCase().match(state_abbrs.join('|'));
}

exports.valid_name = function(name) {
    return name.toUpperCase().match(state_names_upper.join('|'));
}

exports.name_to_abbr = function(name) {
    return state_hash_names[name];
}

// state-specific questions we need to ask after the main flow is completed.
// these are in order of how the questions will be asked, and each item is a
// key in the `chains.vote_1` flow object that loads that question.
exports.required_questions = {
    az: ['us_citizen', 'legal_resident', 'will_be_18', 'incompetent', 'ssn_last4'],
    ca: ['us_citizen', 'legal_resident', 'will_be_18', 'disenfranchised', 'political_party', 'state_id', 'ssn_last4', 'consent_use_signature'],
    co: ['us_citizen', 'state_id'],
    ga: ['us_citizen', 'legal_resident', 'will_be_18', 'disenfranchised', 'incompetent', 'state_id'],
    il: ['us_citizen', 'will_be_18', 'state_id', 'state_id_issue_date'],
    ma: ['us_citizen', 'legal_resident', 'will_be_18', 'disenfranchised', 'disqualified', 'state_id', 'consent_use_signature',],
    nm: ['us_citizen', 'legal_resident', 'will_be_18', 'disenfranchised', 'state_id', 'ssn'],
};
// defaults for national voter registration form via vote.org
exports.required_questions_default = ['us_citizen', 'will_be_18', 'state_id'];
