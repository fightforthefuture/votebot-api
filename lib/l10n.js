var l10n = {
    msg_intro: {
        en: "(Hi, this is HelloVote! I can check to see if you’re registered, and then help you register to vote!)",
        es: "Hola"
    },
    msg_intro_facebook_get_started: {
        en: 'Hi, I\'m HelloVote! I can get you registered to vote with just a few messages. If you\'re already registered, I can help your friends!'
    },
    msg_intro_facebook: {
        en: "OK, I can help you register to vote. I'll ask a few questions to fill out your registration form. Your answers are private and secure."
    },
    prompt_first_name: {
        en: "So what's your first name? This is an official form, so it should match your photo ID."
    },
    prompt_first_name_fb: {
        en: "So what's your first name? This is an official form, so it should match your photo ID."
    },
    prompt_confirm_first_name: {
        en: "Just confirming - we'll ask your last name separately. So is your FIRST name \"{{first_name}}\"? (yes/no)"
    },
    error_first_name: {
        en: "Please enter your first name"
    },
    prompt_last_name: {
        en: "OK {{first_name}}, what's your last name? Again, this needs to match your official information."
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
    msg_already_registered: {
        en: 'Awesome! Our data says you\'re already registered to vote at that address!'
    },
    msg_not_yet_registered: {
        en: 'I checked a national voter registration database, and it looks like you\'re not registered at that address. Let\'s get you registered, just to be sure!',
    },
    msg_complete: {
        en: "Congratulations! I have submitted your voter registration in {{settings.state}}! We just emailed you a receipt."
    },
    prompt_incomplete: {
        en: "Sorry, your registration is incomplete. Say RETRY to try again, RESTART to start over"
    },
    msg_share: {
        en: "Please share HelloVote!\n* Share on Facebook: hellovote.org/share\n* Share on Twitter: hellovote.org/tweet"
    },
    msg_share_sms: {
        en: "Forward this message to everyone you care about! Register to vote by text message: Text HELLO to sms:384-387 or visit https://hello.vote"
    },
    msg_sms_notice: {
        en: "Fight for the Future (FFTF) & its Education Fund (FFTFEF) will text you voting information and other action alerts. To stop messages, text STOP to 384387."
    },
    msg_sms_notice_partner: {
        en: "Fight for the Future (FFTF), its Education Fund (FFTFEF) & {{partner}} will text you voting information and other action alerts."
    },
    msg_sms_fftf_stop: {
        en: "(To stop messages from FFTF & FFTFEF, text STOP to 384387.)"
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
    prompt_other_political_designation: {
        en: "Please name your political party, and we'll try to match it to the list of political designations in {{settings.state}}."
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
        en: "What's your drivers license or state ID number? If you don't have one, reply \"none\" ({{settings.state}} needs this info to process your voter registration)"
    },
    error_state_id_number: {
        en: "Please enter your state ID or drivers license number"
    },
    prompt_state_id_issue_date: {
        en: "What date was your state ID/driver's license issued? (mm/dd/yyyy)"
    },
    prompt_ssn: {
        en: "One more thing - in order to finish your registration, your state wants to know your social security number."
    },
    prompt_ssn_last4: {
        en: "Your state also wants to know the last 4 digits of your social security number."
    },
    error_ssn_last4: {
        en: "Please enter the last 4 digits of your social security number."
    },
    prompt_state_id_or_ssn_last4: {
        en: "Ok, if you don't have a {{settings.state}} ID, your state wants to know the last 4 digits of your social security number."
    },
    prompt_state_id_or_full_ssn: {
        en: "OK, if you don't have a {{settings.state}} ID, your state wants to know your social security number."
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
        en: "Would you like to receive emails from us as well (you can unsubscribe at any time)? (yes/no)"
    },
    msg_fftf_opt_in_thanks: {
        en: "Thanks for joining us at Fight for the Future!"
    },
    prompt_ineligible: {
        en: "Sorry--based on your answer, you\'re not eligible to vote. Plz say BACK if you need to make a correction. Or, say YES and I can help your friends get registered!"
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
        en: 'Please enter your social security number like 123-45-6789'
    },
    error_validate_ssn_last4: {
        en: 'Please enter just the last 4 digits of your social security number'
    },
    error_validate_state_id_number: {
        en: 'Please enter a valid {{settings.state}} ID. If you don\'t have one, reply "NONE" and we will try something else.'
    },
    error_state_deadline_expired: {
        en: 'Sorry, the online voter registration deadline for {{settings.state}} has passed. You may still be eligible to register to vote in person'
    },
    error_validate_state_abbreviation: {
        en: 'Sorry, that\'s not a valid US state abbrevation.'
    },
    error_validate_state_name: {
        en: 'Sorry, that\'s not a valid US state name.'
    },
    msg_happy_birthday: {
        en: 'Happy birthday! \u{1F382}'
    },
    prompt_email_for_ovr: {
        en: "I'm about to look up your registration status and send you crucial voting info. What's your email address?"
    },
    prompt_email_for_pdf: {
        en: "I'm about to look up your registration status and send you crucial voting info. What's your email address?"
    },
    msg_complete_ovr: {
        en: 'HelloVote just submitted your information to {{settings.state}}\'s online voter registration system, and I sent you an email receipt (be sure to read it!)'
    },
    msg_complete_ovr_disclaimer: {
        en: 'Don\'t assume you\'re registered until you confirm with your state: hellovote.org/confirm/#{{settings.state}} - it may take days or weeks, but plz check! Your vote is important!'
    },
    msg_complete_pdf: {
        en: "Great, now this is super important. We just emailed you a form. You **must** print, sign, and mail it, or you won't be registered! The deadline for {{settings.state}} is {{deadline}}."
    },
    msg_complete_pdf_fb: {
        en: "Here's your voter registration form (I also emailed you a copy!) You **must** print, sign, and mail it, or you won't be registered. The deadline for {{settings.state}} is {{deadline}}."
    },
    msg_complete_mail: {
        en: "I'm mailing your form now! It should arrive by {{mail_eta}}. Once it does, you **must** sign & mail it, or you won't be registered! The deadline for {{settings.state}} is {{deadline}}"
    },
    msg_ovr_failed: {
        en: 'Hmm, something went wrong when I tried to submit through the {{settings.state}} Online Voter Registration system, but no worries. We can do it the old-fashioned way.'
    },
    frag_soon: {
        en: 'soon'
    },
    prompt_choose_nvra_delivery: {
        en: "OK - I can mail your voter registration form to you, but it'll take a few days & deadlines are approaching! Can you print it yourself instead? (yes/no)"
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
        en: 'We\'re all done. Would you like to start again? (yes/no)'
    },
    msg_unsubscribed: {
        en: 'You are unsubscribed from Fight for the Future and Education Fund. No more messages will be sent. Email team@hello.vote to restart.'
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
        en: 'One moment please...'
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
        en: 'OK. Please say your full previous address **including** apartment number, city, state and zip code. (Reply SKIP if you didn\'t change your address)'
    },
    prompt_previous_address_street: {
        en: 'Arg, I\'m sorry but I couldn\'t look up that address. Can you break it down for me? Please say just the number & street portion of that address (eg. 123 Main St.)'
    },
    prompt_previous_address_unit: {
        en: 'Alright, and what\'s the apartment number? (If you didn\'t have one, reply NONE)'
    },
    prompt_previous_city: {
        en: 'What city were you previously registered to vote in?'
    },
    prompt_previous_state: {
        en: 'What state were you previously registered to vote in?'
    },
    prompt_previous_zip: {
        en: 'What zip code were you previously registered to vote in?'
    },
    prompt_previous_county: {
        en: 'And finally, what county was your previous address in?'
    },
    prompt_has_previous_name: {
        en: 'Alright then, have you been registered to vote in {{settings.state}} under a different name?'
    },
    prompt_previous_name: {
        en: 'What name were you previously registered under? (Reply SKIP if you didn\'t change your name)'
    },
    prompt_has_previous_name_address: {
        en: 'Were you previously registered to vote under a different name or address? (yes/no)'
    },
    prompt_has_separate_mailing_address: {
        en: 'Do you receive mail at a different address than your residential address?'
    },
    prompt_separate_mailing_address: {
        en: 'OK. Please say your full mailing address including city, state and zip code.'
    },
    prompt_change_state: {
        en: 'Are you currently registered to vote in any other state? If so, say it here. If not, say "NO".'
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
    },
    prompt_nudge: {
        en: 'Still there? Your voter registration isn\'t finished yet. Say "Yes" to continue, or "Stop" to unsubscribe.'
    },
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
