var l10n = {
    msg_intro: {
        en: "Hi this is HelloVote! I'm going to help you register to vote. I'll ask a few questions to fill out your registration form. Your answers are private and secure.",
        es: "Hola"
    },
    msg_intro_facebook_get_started: {
        en: 'Hi, I\'m HelloVote! I can get you registered to vote with just a few messages. If you\'re already registered, I can help your friends!'
    },
    msg_intro_facebook: {
        en: "OK, I can help you register to vote. I'll ask a few questions to fill out your registration form. Your answers are private and secure."
    },
    prompt_first_name: {
        en: "So, what's your first name? This is an official form, so it should match your government ID."
    },
    error_first_name: {
        en: "Please enter your first name"
    },
    prompt_last_name: {
        en: "Ok {{first_name}}, what's your last name? Again, this needs to match your official information."
    },
    error_last_name: {
        en: "Please enter your last name"
    },
    prompt_zip: {
        en: "Got it. Now, what's your zip code? (By the way, you can say \"go back\" if you ever need to go back a step, or \"help\" for more options!)"
    },
    error_zip: {
        en: "Please enter your five-digit zip code, or SKIP if you don't know it."
    },
    prompt_city: {
        en: "What city do you live in?"
    },
    error_city: {
        en: "Please enter your city"
    },
    prompt_state: {
        en: "What state do you live in? (eg CA)"
    },
    error_state: {
        en: "Please enter your state"
    },
    prompt_address: {
        en: "What's your street address in {{settings.city}}, {{settings.state}}?"
    },
    error_address: {
        en: "Please enter just your street address, not the city or state."
    },
    prompt_apartment: {
        en: "What\'s your apartment number? (If you don't have one, reply: none)"
    },
    error_apartment: {
        en: "Please enter an apartment number"
    },
    prompt_date_of_birth: {
        en: "What day were you born? (month/day/year)"
    },
    error_date_of_birth: {
        en: "Please enter your date of birth as month/day/year"
    },
    msg_date_of_birth_appears_bogus: {
        en: 'Are you sure you didn\'t make a typo on that birthday? Say \'go back\' if you need to correct it'
    },
    prompt_will_be_18: {
        en: "Are you 18 or older, or will you be by the date of the election? (yes/no)"
    },
    prompt_email: {
        en: "Almost done! We'll now send your registration form and crucial voting information. What's your email?"
    },
    error_email: {
        en: "Please enter your email address. If you don't have one, reply SKIP"
    },
    prompt_confirm_name_address: {
        en: 'The name and address I have for you is:\n{{first_name}} {{last_name}}, {{settings.address}} {{settings.address_unit}} {{settings.city}} {{settings.state}}\nIs this correct (yes/no)?'
    },
    error_confirm_name_address: {
        en: 'Please reply "yes" or "no" to confirm your information'
    },
    msg_complete: {
        en: "Congratulations! I have submitted your voter registration in {{settings.state}}! We just emailed you a receipt."
    },
    prompt_incomplete: {
        en: "Sorry, your registration is incomplete. Say RETRY to try again, RESTART to start over"
    },
    msg_share: {
        en: "Now, there's one last important thing. Please pass on the <3 and register some friends! Tap here to share on Facebook: https://fftf.io/hellovote"
    },
    msg_share_facebook_messenger: {
        en: "Now, there's one last important thing. Please pass on the <3 and register some friends! Tap the button below to share me on Facebook."
    },
    prompt_restart: {
        en: "This will restart your HelloVote registration! Reply OK to continue or BACK to go back."
    },
    prompt_us_citizen: {
        en: "Are you a US citizen? (yes/no)"
    },
    prompt_legal_resident: {
        en: "Are you a current legal resident of {{settings.state}}? (yes/no)"
    },
    prompt_military_or_overseas: {
        en: "Are you a military or overseas voter? (military/overseas/no)"
    },
    error_military_or_overseas: {
        en: "Sorry, I didn't get that. Please answer (military/overseas/no)"
    },
    prompt_ethnicity: {
        en: "What is your ethnicity or race? (asian-pacific/black/hispanic/native-american/white/multi-racial/other)"
    },
    error_ethnicity: {
        en: "Please let me know your ethnicity or race."
    },
    prompt_political_party: {
        en: "What's your party preference? (democrat/republican/libertarian/green/other/none)"
    },
    error_political_party: {
        en: "Please let me know your party preference, so I can ensure you are registered correctly."
    },
    prompt_disenfranchised: {
        en: "Have you been disenfranchised from voting, or are you currently imprisoned or on parole for the conviction of a felony? (yes/no)"
    },
    prompt_disqualified: {
        en: "Are you under guardianship which prohibits your registering to vote, or are you disqualified because of corrupt practices in respect to elections? (yes/no)"
    },
    prompt_incompetent: {
        en: "Have you been found legally incompetent in your state? (yes/no)"
    },
    prompt_phone: {
        en: "What's your phone number?"
    },
    error_phone: {
        en: 'Sorry, that wasn\'t a valid phone number. Please format like 510-555-1212'
    },
    prompt_state_id_number: {
        en: "Alright, last thing - in order to finish your registration, {{settings.state}} wants to know your drivers license or state-issued ID number. (I don't keep this info!)"
    },
    error_state_id_number: {
        en: "Please enter your state ID or drivers license number"
    },
    prompt_state_id_issue_date: {
        en: "What date was your state ID/driver's license issued? (mm/dd/yyyy)"
    },
    prompt_ssn: {
        en: "One more thing - in order to finish your registration, your state wants to know your social security number. (I don't keep this info!)"
    },
    prompt_ssn_last4: {
        en: "Your state also wants to know the last 4 of your SSN. (I don't keep this info either!)"
    },
    error_ssn_last4: {
        en: "Please enter the last 4 digits of your SSN."
    },
    prompt_state_id_or_ssn_last4: {
        en: "Alright, last thing - in order to finish your registration, your state wants to know your social security or {{settings.state}} id number. (I don't keep this info either!)"
    },
    error_state_id_or_ssn_last4: {
        en: "Please enter your state ID number or last 4 of your SSN"
    },
    prompt_gender: {
        en: "What's your gender?"
    },
    prompt_county: {
        en: "What county do you reside in?"
    },
    error_county: {
        en: "Please enter the name of the county you reside in"
    },
    prompt_consent_use_signature: {
        en: "To submit your registration directly with the state, I can use your signature on file with the DMV. Is this ok? (yes/no)"
    },
    error_consent_use_signature: {
        en: "Please reply YES to let me submit your registration using your signature from the DMV. I do not keep this information."
    },
    prompt_vote_by_mail: {
        en: "Would you like to vote by mail-in ballot?"
    },
    prompt_fftf_opt_in: {
        en: "By the way ~ HelloVote is made by FightForTheFuture.org, a nonprofit which protects the world-changing power of the Internet. Join us for campaign updates? (yes/no)"
    },
    msg_fftf_opt_in_thanks: {
        en: "Thanks for joining us at Fight for the Future!"
    },
    prompt_ineligible: {
        en: "Sorry, you are ineligible to register to vote with HelloVote. Restart?"
    },
    error_validate_date: {
        en: 'I didn\'t understand that date. Please format like MM/DD/YYYY'
    },
    error_validate_phone: {
        en: 'Sorry, that wasn\'t a valid phone number. Please format like 510-555-1212'
    },
    error_validate_email: {
        en: 'I need your email address to send you a registration receipt and voting reminders. If you don\'t have one, reply NONE.'
    },
    error_validate_boolean_yes: {
        en: 'Please answer yes or no'
    },
    warning_validate_boolean_yes: {
        en: 'Are you sure? If you don\'t answer "yes", you can\'t register to vote in your state.'
    },
    warning_validate_boolean_no: {
        en: 'Are you sure? If you don\'t answer "no", you can\'t register to vote in your state.'
    },
    error_validate_state_abbreviation: {
        en: 'That\'s not a valid state abbreviation. Please enter only 2 letters.'
    },
    error_validate_state_name: {
        en: 'That\'s not a valid state name.'
    },
    error_validate_zip: {
        en: 'That\'s not a valid zip code. Please enter only 5 numbers.'
    },
    error_validate_zip_is_bogus: {
        en: 'I couldn\'t find that zip code'
    },
    error_validate_address: {
        en: 'Please enter your mailing address.'
    },
    error_validate_address_is_bogus: {
        en: 'Sorry, I couldn\'t look up your address. Please check if it was correct, and say it again.'
    },
    error_validate_apartment: {
        en: 'I couldn\'t verify that apartment number. Please try again.'
    },
    error_validate_gender: {
        en: 'Please enter your gender as male or female'
    },
    error_validate_military_or_overseas: {
        en: "Sorry, I didn't get that. Please answer (military/overseas/no)"
    },
    error_validate_ssn: {
        en: 'Please enter your SSN like 123-45-6789'
    },
    error_validate_ssn_last4: {
        en: 'Please enter just the last 4 digits of your SSN'
    },
    error_validate_state_id_number: {
        en: 'Please enter a valid {{settings.state}} ID. If you don\'t have one, I can\'t submit your registration. Reply NONE and I\'ll send you a form to print and mail.'
    },
    error_state_deadline_expired: {
        en: 'Sorry, the online voter registration deadline for {{settings.state}} has passed. You may still be eligible to register to vote in person'
    },
    msg_happy_birthday: {
        en: 'Happy birthday! \u{1F382}'
    },
    prompt_email_for_ovr: {
        en: "Almost done! Now, {{settings.state}} requires an email for online registration. I'll also send you crucial voting information. What's your email?"
    },
    prompt_email_for_pdf: {
        en: "Almost done! Now, {{settings.state}} requires you to print, sign, and mail a form. We’ll email it to you, along with crucial voting information. What's your email?"
    },
    msg_complete_ovr: {
        en: 'Congratulations! I have submitted your voter registration in {{settings.state}}! We just emailed you a receipt.'
    },
    msg_complete_pdf: {
        en: "Great! In a moment, I'll email you a completed voter registration form to print, sign, and mail."
    },
    error_incomplete: {
        en: 'Sorry, your registration is missing a required field.'
    },
    error_incomplete_you_are_missing: {
        en: 'You are missing:'
    },
    msg_trying_again: {
        en: 'Sending your registration again.'
    },
    prompt_restart_after_complete: {
        en: 'You are registered with HelloVote. Would you like to start again? (yes/no)'
    },
    msg_unsubscribed: {
        en: 'You are unsubscribed from Fight for the Future. No more messages will be sent. Reply HELP for help or 844-344-3556.'
    },
    msg_help: {
        en: 'Fight for the Future: Help at hellovote.org or 844-344-3556. Msg&data rates may apply. Text STOP to cancel.'
    },
    msg_try_again: {
        en: 'Please try again!'
    },
    msg_error_unknown: {
        en: 'I seem to have had a glitch. Please send your last message again.'
    },
    msg_error_failed: {
        en: 'Agh, an error occurred and your voter registration could not be processed. Please let us know: team@hellovote.org - reference # '
    },
    msg_processing: {
        en: 'I am processing your voter registration now! I\'ll let you know when this is done!'
    },
    msg_address_appears_bogus: {
        en: '(FYI - I couldn\'t look up that address. Are you sure you didn\'t make a typo? If you need to correct it, say "BACK" to go back :)'
    },
    prompt_ovr_disclosure: {
        en: 'In order to continue, you must agree to the following statement'
    },
    prompt_confirm_ovr_disclosure: {
        en: 'Do you agree? Say YES or NO (If you couldn\'t read it, click here {url})'
    },
    prompt_has_previous_address: {
        en: 'Have you previously been registered under a different address in {{settings.state}}?'
    },
    prompt_previous_address: {
        en: 'OK. Please say your previous address including city, state and zip code.'
    },
    prompt_has_previous_name: {
        en: 'Alright then, have you been registered to vote in {{settings.state}} under a different name?'
    },
    prompt_previous_name: {
        en: 'OK. Please say the full name you were previously registered under.'
    },
    prompt_has_separate_mailing_address: {
        en: 'Do you receive mail at a different address than your residential address?'
    },
    prompt_separate_mailing_address: {
        en: 'OK. Please say your full mailing address including city, state and zip code.'
    },
    button_register_to_vote: {
        en: 'Register to vote'
    },
    button_register_my_friends: {
        en: 'Register my friends'
    },
    button_learn_more: {
        en: 'Learn more...'
    },
    prompt_facebook_get_started_share: {
        en: 'OK! I can get your friends registered to vote right from Facebook Messenger. Tap the button below to share me with your friends!'
    },
    button_share: {
        en: 'Share HelloVote!'
    }
};

module.exports = function(key, locale)
{
	locale || (locale = 'en');

    if (typeof l10n[key] === "undefined" || typeof l10n[key]["en"] === "undefined")
        return key;
    else if (typeof l10n[key][locale] === "undefined")
        return l10n[key]["en"];
    else
        return l10n[key][locale];
};

