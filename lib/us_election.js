var google_civic = require('../lib/google_civic');
var us_states = require('../lib/us_states');
var moment = require('moment');

exports.get_ovr_deadline = function(abbr) {
    // convert abbr to state name
    var state_name = us_states.abbr_to_name(abbr);
    var requirements = google_civic.registration_requirements[state_name]
    if (requirements) {
      return requirements["Deadlines"];
    } else {
      return {};
    }
}

exports.get_registration_requirements = function(abbr) {
  var state_name = us_states.abbr_to_name(abbr);
  var requirements = google_civic.registration_requirements[state_name]
  if (requirements) {
    return requirements;
  } else {
    return {};
  }
}

exports.is_too_late_for_mailer = function(abbr) {
    var state_name = us_states.abbr_to_name(abbr);
    var requirements = google_civic.registration_requirements[state_name];
    var deadlines = requirements["Deadlines"];
    var today = moment();

    // today = moment('2016-10-10', 'YYYY-MM-DD'); // JL DEBUG ~ 

    if (deadlines["received-by"]) {
        var cutoff = moment(deadlines['received-by'], 'YYYY-MM-DD');
        return today.isAfter(cutoff.subtract(9, "days"), 'day');

    } else if (deadlines["mail-by"]) {
        var cutoff = moment(deadlines['mail-by'], 'YYYY-MM-DD');
        return today.isAfter(cutoff.subtract(7, "days"), 'day');
    }
    return false;
}

exports.is_too_late_to_mail = function(abbr) {
    var state_name = us_states.abbr_to_name(abbr);
    var requirements = google_civic.registration_requirements[state_name];
    var deadlines = requirements["Deadlines"];
    var today = moment();

    // today = moment('2016-10-10', 'YYYY-MM-DD'); // JL DEBUG ~ 

    if (deadlines["received-by"]) {
        var cutoff = moment(deadlines['received-by'], 'YYYY-MM-DD');
        return today.isAfter(cutoff.subtract(3, "days"), 'day');

    } else if (deadlines["mail-by"]) {
        var cutoff = moment(deadlines['mail-by'], 'YYYY-MM-DD');
        return today.isAfter(cutoff, 'day');
    }
    return false;
}

exports.get_mail_deadline_text = function(abbr) {
  var requirements = exports.get_registration_requirements(abbr);
  var state_name = us_states.abbr_to_name(abbr);
  var deadline_text = '';
  if (requirements["Deadlines"]) {
    if (requirements["Deadlines"]["received-by"]) {
      var deadline = moment(requirements["Deadlines"]["received-by"]).format('MMMM D')
      deadline_text = 'Registrations must be received by '+deadline+' in '+state_name;
    } else if (requirements["Deadlines"]["mail-by"]) {
      var deadline = moment(requirements["Deadlines"]["mail-by"]).format('MMMM D')
      deadline_text = 'The mailing deadline for '+state_name+' is '+deadline;
    }
  }
  if (!deadline_text) {
    deadline_text = 'The mailing deadline is soon';
  }
  return deadline_text;
}

// some states do not accept the national voter registration form, give these users specific instructions
exports.states_without_nvra = {
    NH: 'NH prefers you register in person. You can do it until 10/29 at your city or town clerk, or on Election Day at your polling place. More @ https://hello.vote/nh', 
    ND: 'ND does not require voter registration. You do not need to fill out this form.',
    WI: 'WI does not accept the federal form and requires proof of ID. Call (866) 868-3947 to have the WI form mailed to you, or download a copy @ https://hello.vote/wi',
    WY: 'WY requires voter registration forms be notarized. Call (307) 777-5860 to have one mailed to you.'
};

// state-specific questions we need to ask after the main flow is completed.
// these are in order of how the questions will be asked, and each item is a
// key in the `chains.vote_1` flow object that loads that question.


// defaults for national voter registration
exports.required_questions_default = ['us_citizen', 'will_be_18', 'has_previous_name_address', 'political_party'];
// append state specific questions, to match NVRA and votebot-forms
exports.state_required_questions = {
    AL: ['ssn'],
    AK: ['state_id_number', 'ssn_last4'],
    AZ: ['has_separate_mailing_address', 'legal_resident', 'political_party', 'state_id_number', 'ssn_last4', 'az_pevl', 'ovr_disclosure'],
    AR: ['state_id_number', 'state_id_or_ssn_last4',],
    CA: ['political_party', 'county', 'state_id_number', 'ssn_last4', 'consent_use_signature', 'ovr_disclosure'],
    CO: ['gender', 'military_or_overseas', 'vote_by_mail', 'political_party', 'state_id_number', 'state_id_or_ssn_last4', 'consent_use_signature', 'ovr_disclosure'],
    CT: ['state_id_number', 'state_id_or_ssn_last4',],
    DE: ['state_id_number', 'state_id_or_ssn_last4'],
    DC: ['state_id_number', 'state_id_or_ssn_last4'],
    FL: ['state_id_number', 'state_id_or_ssn_last4'],
    GA: ['political_party', 'state_id_number', 'state_id_or_ssn_last4', 'consent_use_signature', 'ovr_disclosure'],
    HI: ['gender', 'state_id_number', 'ssn', 'legal_resident'],
    ID: ['state_id_number', 'state_id_or_ssn_last4'],
    IL: ['gender', 'county', 'political_party', 'state_id_number', 'state_id_issue_date', 'ssn_last4', 'ovr_disclosure'],
    IN: ['state_id_number', 'state_id_or_ssn_last4'],
    IA: ['state_id_number', 'state_id_or_ssn_last4'],
    KS: ['state_id_number', 'state_id_or_ssn_last4'],
    KY: ['ssn', 'gender', 'political_party', 'ovr_disclosure'],
    LA: ['state_id_number', 'state_id_or_ssn_last4'],
    ME: ['state_id_number', 'state_id_or_ssn_last4'],
    MD: ['state_id_number', 'state_id_or_ssn_last4'],
    MA: ['political_party', 'state_id_number', 'state_id_or_ssn_last4', 'consent_use_signature', 'ovr_disclosure'],
    MI: ['state_id_number', 'state_id_or_ssn_last4'],
    MN: ['state_id_number', 'state_id_or_ssn_last4'],
    MS: ['state_id_number', 'state_id_or_ssn_last4'],
    MO: ['state_id_number', 'state_id_or_ssn_last4'],
    MT: ['state_id_number', 'state_id_or_ssn_last4'],
    NH: ['ineligible'],
    NE: ['state_id_number', 'state_id_or_ssn_last4'],
    NV: ['state_id_number', 'state_id_or_ssn_last4'],
    NJ: ['state_id_number', 'state_id_or_ssn_last4'],
    NY: ['state_id_number', 'state_id_or_ssn_last4'],
    NM: ['ssn',],
    NC: ['state_id_number', 'state_id_or_ssn_last4'],
    ND: ['ineligible',],
    OH: ['state_id_number', 'state_id_or_ssn_last4'],
    OK: ['state_id_number', 'ssn_last4',],
    OR: ['state_id_number', 'state_id_or_ssn_last4'],
    PA: ['state_id_number', 'state_id_or_ssn_last4'],
    RI: ['state_id_number', 'state_id_or_ssn_last4'],
    SC: ['ssn',],
    SD: ['state_id_number', 'state_id_or_ssn_last4'],
    TN: ['ssn',],
    TX: ['state_id_number', 'state_id_or_ssn_last4'],
    UT: ['state_id_number', 'state_id_or_ssn_last4'],
    VA: ['gender', 'legal_resident', 'change_state', 'political_party', 'state_id_number', 'ssn', 'consent_use_signature', 'ovr_disclosure'],
    VT: ['legal_resident', 'state_id_number', 'ovr_disclosure'],
    WA: ['state_id_number', 'state_id_or_ssn_last4'],
    WV: ['legal_resident', 'state_id_number', 'ssn_last4', 'consent_use_signature', 'ovr_disclosure'],
    WI: ['state_id_number', 'state_id_or_ssn_last4'],
    WY: ['ineligible',]
};

exports.state_integrated_ovr = {
  AZ: true,
  CA: true,
  CO: true,
  GA: true,
  HI: true,
  IL: true,
  KY: true,
  MA: true,
  VA: true,
  VT: true,
};

exports.state_share_urls = {
    AL: {
        tweet_url: 'https://fftf.io/al',
        image: 'https://hello.vote/images/animations/al.gif'
    },
    FL: {
        tweet_url: 'https://fftf.io/fl',
        image: 'https://hello.vote/images/animations/fl.gif'
    },
    GA: {
        tweet_url: 'https://fftf.io/ga',
        image: 'https://hello.vote/images/animations/ga.gif'
    },
    IN: {
        tweet_url: 'https://fftf.io/in',
        image: 'https://hello.vote/images/animations/in.gif'
    },
    KY: {
        tweet_url: 'https://fftf.io/ky',
        image: 'https://hello.vote/images/animations/ky.gif'
    },
    LA: {
        tweet_url: 'https://fftf.io/la',
        image: 'https://hello.vote/images/animations/la.gif'
    },
    MI: {
        tweet_url: 'https://fftf.io/mi',
        image: 'https://hello.vote/images/animations/mi.gif'
    },
    NM: {
        tweet_url: 'https://fftf.io/nm',
        image: 'https://hello.vote/images/animations/nm.gif'
    },
    OH: {
        tweet_url: 'https://fftf.io/oh',
        image: 'https://hello.vote/images/animations/oh.gif'
    },
    PA: {
        tweet_url: 'https://fftf.io/pa',
        image: 'https://hello.vote/images/animations/pa.gif'
    },
}

exports.state_confirmation_disclosures = {
  AZ: {
    text: '* I am a RESIDENT of Arizona\n'+
          '* I am NOT a convicted FELON, or my civil rights are restored\n'+
          '* I have not been adjudicated INCOMPENTENT (A.R.S. § 14-5101)\n'+
          '* I am a CITIZEN on the United States of America\n'+
          '* I will be at least 18 YEARS OF AGE by the next general election, November 8, 2016'+
          '* I authorize the Motor Vehicle Division to release my information, including my digitized signature and address, to the County Recorder for the purposes of maintaining the voter registration rolls.'+
          'I hereby affirm that the information I have provided in this application for voter registration is true and correct and agree that it is my obligation to keep this information up-to-date.'+
          'I further acknowledge that I am aware that providing false information is a Class 6 felony.',
    url: 'https://hello.vote/az',
    store: {
      'user.settings.us_citizen': true,
      'user.settings.disenfranchised': false,
      'user.settings.incompetent': false
    },
    ovr_site_url: 'https://servicearizona.com/webapp/evoter/selectLanguage'
  },
  CA: {
    text: 'I declare under penalty of perjury under the laws of the State of California that\n'+
          '* I am a U.S. citizen and will be at least 18 years old on election day.\n'+
          '* I am not currently imprisoned or on parole for the conviction of a felony.\n'+
          '* I understand that it is a crime to intentionally provide incorrect information on this form.\n'+
          '* The information on this form is true and correct.',
    url: 'https://hello.vote/ca',
    store: {
      'user.settings.us_citizen': true,
      'user.settings.disenfranchised': false,
      'user.settings.disqualified': false
    },
    ovr_site_url: 'http://registertovote.ca.gov/'
  },
  CO: {
    text: 'I am aware that if I register to vote in Colorado I am also considered a resident of Colorado for motor vehicle registration and operation purposes and for income tax purposes. I affirm that I am a citizen of the United States; I have been a resident of the state of Colorado for at least twenty-two days immediately prior to an election in which I intend to vote; and I am at least sixteen years old and understand that I must be eighteen years old to be eligible to vote. I further affirm that my present address as stated herein is my sole legal place of residence, that I claim no other place as my legal residence, and that I understand that I am committing a felony if I knowingly give false information regarding my place of present residence. I certify under penalty of perjury that I meet the registration qualifications; that the information I have provided on this application is true to the best of my knowledge and belief; and that I have not, nor will I, cast more than one ballot in any election.',
    url: 'https://hello.vote/co',
    store: {
      'user.settings.us_citizen': true,
      'user.settings.legal_resident': true,
      'user.settings.confirm_name_address': true,
    },
    ovr_site_url: 'https://www.sos.state.co.us/voter-classic/pages/pub/olvr/verifyNewVoter.xhtml'
  },
  GA: {
    text: 'Please verify that you are eligible to register to vote in Georgia by affirming all of the statements below: \n'+
          '* I am a citizen of the United States\n'+
          '* I am a legal resident of the county\n'+
          '* I am 17 1/2 years of age at the time of registration and will be 18 years of age by the time I can vote\n'+
          '* I am not serving a sentence for conviction of a felony involving moral turpitude\n'+
          '* I have not been found mentally incompetent by a judge',
    url: 'https://hello.vote/ga',
    store: {
      'user.settings.us_citizen': true,
      'user.settings.legal_resident': true,
      'user.settings.will_be_18': true,
      'user.settings.disenfranchised': false,
      'user.settings.incompetent': false
    },
    ovr_site_url: 'https://registertovote.sos.ga.gov/GAOLVR/welcome.do#no-back-button'
  },
  IL: {
    text: '* I am a citizen of the United States.\n'+
          '* I will be 17 years old on or before the date of the Primary Election and turn 18 on or before the date of the General Election.\n'+
          '* I will have lived in the State of Illinois and in my election precinct at least 30 days as of the date of the next election.\n'+
          '* I am the person whose name and identifying information is provided on this form, and I desire to register to vote in the State of Illinois.\n'+
          '* All the information I have provided on this form is true and correct as of the date I am submitting this form.\n'+
          'I authorize the Secretary of State to transmit to the State Board of Elections my signature that is on file with the Secretary of State and understand that such signature will be used by my local election authority on this online voter registration application for admission as an elector as if I had signed this form personally.',
    url: 'https://hello.vote/il',
    store: {
      'user.settings.us_citizen': true,
      'user.settings.will_be_18': true,
      'user.settings.legal_resident': true,
      'user.settings.confirm_name_address': true,
      'user.settings.consent_use_signature': true,
      'user.settings.reviewed_information': true,
    },
    ovr_site_url: 'https://ova.elections.il.gov/'
  },
  KY: {
    text: 'Please verify that you are eligible to register to vote in Kentucky:\n'+
          'I am a U.S. Citizen.\n'+
          'I am a current resident of Kentucky.\n'+
          'I will be at least 18 years of age on or before the next general election.\n'+
          'I am not a convicted felon, or if I have been convicted of a felony, my civil rights have been restored by executive pardon.\n'+
          'I have not been judged "mentally incompetent" in a court of law.\n'+
          'I do not claim the right to vote anywhere outside Kentucky.',
   url: 'https://hello.vote/ky',
    store: {
      'user.settings.us_citizen': true,
      'user.settings.legal_resident': true,
      'user.settings.will_be_18': true,
      'user.settings.disenfranchised': false,
      'user.settings.incompetent': false,
      'user.settings.claim_elsewhere': false
    },
    ovr_site_url: 'http://elect.ky.gov/registertovote/pages/default.aspx'
  },
  MA: {
    text: 'I hereby swear (affirm) that I am the person named above, that the above information is true:\n'+
          '* that I AM A CITIZEN OF THE UNITED STATES\n'+
          '* that I am at least 16 years old and I understand that I must be 18 years old to be eligible to vote\n'+
          '* that I am not a person under guardianship which prohibits my registering to vote\n'+
          '* that I am not temporarily or permanently disqualified by law from voting because of corrupt practices in respect to elections\n'+
          '* that I am not currently incarcerated for a felony conviction\n'+
          '* and that I consider this residence to be my home.',
    url: 'https://hello.vote/ma',
    store: {
      'user.settings.us_citizen': true,
      'user.settings.legal_resident': true,
      'user.settings.disenfranchised': false,
      'user.settings.disqualified': false
    },
    ovr_site_url: 'https://www.sec.state.ma.us/ovr/'
  },
  MN: {
    text: 'I hereby swear (affirm) that I am the person named above,\n '+
          'that the above information is true,\n '+
          'that I AM A CITIZEN OF THE UNITED STATES,\n '+
          'that I am at least 16 years old and I understand that I must be 18 years old to be eligible to vote,\n '+
          'that I am not a person under guardianship which prohibits my registering to vote,\n '+
          'that I am not temporarily or permanently disqualified by law from voting because of corrupt practices in respect to elections,\n '+
          'that I am not currently incarcerated for a felony conviction, '+
          'and that I consider this residence to be my home.',
    url: 'https://hello.vote/mn',
    store: {
      'user.settings.us_citizen': true,
      'user.settings.legal_resident': true,
      'user.settings.disenfranchised': false,
      'user.settings.disqualified': false
    },
    ovr_site_url: 'https://mnvotes.sos.state.mn.us/VoterRegistration/VoterRegistrationMain.aspx'
  },
  VA: {
    text: 'I am a U.S. citizen, a resident of Virginia, at least 18 years old by the next general election, have had voting rights restored if convicted of a felony, and have had capacity restored by court order if declared mentally incapacitated.\n\n'+
          'I swear/affirm, under felony penalty for making willfully false material statements or entries, that the information provided on this form is true. I authorize the cancellation of my current registration.\n\n'+
          'When registering to vote, Article II, Section 2 of the Constitution of Virginia (1971) requires you to provide your social security number, if you have one. If you do not provide your social security number, your application will be denied. Voting officials use the social security number as a unique identifier to ensure that no voter is registered in more than one place.\n\n'+
          'Your application will only be open to inspection by the public if the social security number is removed. Your social security number will appear on reports produced only for official use by voter registration and election officials, for jury selection purposes by courts, and all lawful purposes. Your decision to decline to register to vote as well as the office where you submit your application, if you choose to do so, are confidential and will only be used for voter registration purposes.',
    url: 'https://hello.vote/VA',
    store: {
      'user.settings.us_citizen': true,
      'user.settings.legal_resident': true,
      'user.settings.will_be_18': true,
      'user.settings.confirm_name_address': true,
      'user.settings.disenfranchised': false,
      'user.settings.incompetent': false,
      'user.settings.privacy_notice': true,
      'user.settings.authorize_cancellation': true
    },
    ovr_site_url: 'http://elections.virginia.gov/citizen-portal/index.html'
  },
  VT: {
    text: 'If you are registering for the first time in VT, you must provide a copy of your ID\n'+
          'You must also swear or affirm that these are true statements:\n'+
          '- I am a citizen of the United States of America.\n'+
          '- I will be 18 years old on or before the next Election.\n'+
          '- I am a resident of Vermont.\n\n'+
          'I have taken the Voter\'s Oath: (You must be atleast 18 to take the Oath.)\n'+
          'You solemnly swear or affirm that whenever you give your vote or suffrage, touching any matter that concerns the State of Vermont, you will do it so as in your conscience you shall judge will most conduce to the best good of the same, as established by the Constitution, without fear or favor of any person."\n'+
          'I meet all of the eligibility requirements to vote in this municipality. I hereby swear, or affirm, under penalty of perjury and other potential federal or state criminal penalties of up to a $10,000 fine, or imprisonment for not more than fifteen years, or both, that the statements made by me in this application are true.',
    url: 'https://hello.vote/vt',
    store: {
      'user.settings.us_citizen': true,
      'user.settings.will_be_18': true,
      'user.settings.legal_resident': true,
      'user.settings.voters_oath': true,
    },
    ovr_site_url: 'https://olvr.sec.state.vt.us/'
  },
  WV: {
    text: 'Please confirm your eligibility to register to vote by affirming the following.\n'+
          'You are a citizen of the United States of America and a legal resident of West Virginia?\n'+
          'You are at least 17 years of age and will you be 18 by the next general election?\n'+
          'You are not currently under conviction, probation, or parole for any felony, election bribery, or treason?\n'+
          'You have not been judged incompetent by a court of competent jurisdiction?\n'+
          'Attention: Knowingly providing false information is perjury, punishable on conviction by confinement in a penitentiary for not less than one nor more than ten years.\n\n'+
          'I am the person listed above. I hereby consent and authorize the West Virginia Secretary of State and the WV DMV to verify the data I have entered. Upon verification, I agree that WV DMV may release my signature from the WV DMV records and transfer a copy of my signature to the WV Secretary of State for the purpose of completing this electronic voter registration application. I understand that this consent does not verify my identity. I understand that if I knowingly or willingly use or obtain personal information under false pretenses, including authorizing the release of a signature that is not mine, I am in violation of federal and state law; and upon conviction, I will be fined at least $1,000 and/or imprisoned.',
    url:  'https://hello.vote/wv',
    store: {
      'user.settings.us_citizen': true,
      'user.settings.legal_resident': true,
      'user.settings.will_be_18': true, 
      'user.settings.disenfranchised': false,
      'user.settings.incompetent': false,
      'user.settings.consent_use_signature': true,
    },
    ovr_site_url: 'https://ovr.sos.wv.gov/Register/Landing#Qualifications'
  }
}
