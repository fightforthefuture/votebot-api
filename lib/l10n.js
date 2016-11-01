var l10n = {
    msg_intro: {
        en: "Hi, this is HelloVote! I can help you register to vote, remember to vote, and remind your friends to vote too. Your answers are private & secure. hellovote.org",
        es: "Saludos, esto es HelloVote. Yo puedo ayudarle a registrarse para votar, recuerda a votar, y recuerde a sus amigos a ver demasiado. Sus respuestas seran privadas y seguras. hellovote.org"
    },
    msg_intro_facebook_get_started: {
        en: 'Hi, I\'m HelloVote! I can get you registered to vote with just a few messages. If you\'re already registered, I can help your friends!',
        es: "Saludos, soy HolaVote. Yo puedo ayudarle a registrarse para votar con solo unos mensajes. Si ya està registrado ¡también puedo ayudar a sus amistades!"
    },
    msg_intro_facebook: {
        en: "OK, I can help you register to vote. I'll ask a few questions to fill out your registration form. Your answers are private and secure.",
        es: "Bueno, yo puedo ayudarle a registrarse para votar. Le haré unas preguntas para completar el formulario de inscripción. Sus respuestas seran privadas y seguras."
    },
    prompt_first_name: {
        en: "So what's your first name? (Please use your legal first name as listed on your photo ID, so I can look up your voter registration status.)",
        es: "¿Cuál es su nombre? Este formulario es oficial, así que su nombre debe aparecer igual que en su identificación."
    },
    prompt_first_name_fb: {
        en: "So what's your first name? (Please use your legal first name as listed on your photo ID, so I can look up your voter registration status.)",
        es: "¿Cuál es su nombre? Este formulario es oficial, así que su nombre debe aparecer igual que en su identificación."
    },
    prompt_confirm_first_name: {
        en: "Just confirming - we'll ask your last name separately. So is your FIRST name \"{{first_name}}\"? (yes/no)",
        es: "Sólo confirmando - vamos a pedirle su apellido por separado. ¿Así que \"{{first_name}}\" es su nombre? (si/no)"
    },
    error_first_name: {
        en: "Please enter your first name",
        es: "Por favor ingrese su nombre"
    },
    prompt_last_name: {
        en: "OK {{first_name}}, what's your last name? Again, this needs to match your official information.",
        es: "Ok {{first_name}}, ¿Cual es su apellido? De nuevo, tiene que ser idéntico a su información oficial."
    },
    error_last_name: {
        en: "Please enter your last name",
        es: "Por favor ingrese su apellido"
    },
    prompt_zip: {
        en: "Got it. Now, what's your zip code? (By the way, you can say \"go back\" if you ever need to go back a step, or \"help\" for more options!)",
        es: "Lo tengo. Ahora, ¿cuál es su código postal? (A propósito, puedes decir \"regresar\" si quieres retroceder un paso o \"ayuda\" para más opciones)"
    },
    error_zip: {
        en: "Please enter your five-digit zip code, or SKIP if you don't know it.",
        es: "Por favor, ingrese su código postal de cinco dígitos, o ingrese SALTAR si no lo sabe."
    },
    prompt_city: {
        en: "What city do you live in?",
        es: "¿En qué ciudad vives?"
    },
    error_city: {
        en: "Please enter your city",
        es: "Por favor, ingrese su ciudad"
    },
    prompt_state: {
        en: "What state do you live in? (eg CA)",
        es: "¿En qué estado vive usted? (Por ejemplo, CA)"
    },
    error_state: {
        en: "Please enter your state",
        es: "Por favor, ingrese su estado"
    },
    prompt_address: {
        en: "What's your street address in {{settings.city}}, {{settings.state}}?",
        es: "¿Cual es su dirección en {{settings.city}}, {{settings.state}}?"
    },
    error_address: {
        en: "Please enter just your street address, not the city or state.",
        es: "Por favor, ingrese su dirección de calle, no la ciudad o estado"
    },
    prompt_apartment: {
        en: "What\'s your apartment number? (If you don't have one, reply: none)",
        es: "¿Cuál es su número de apartamento? (Si no tiene uno, responda: ninguno)"
    },
    error_apartment: {
        en: "Please enter an apartment number",
        es: "Por favor, ingrese su número de apartamento"
    },
    prompt_date_of_birth: {
        en: "What day were you born? (month/day/year)",
        es: "Cual es su fecha de nacimiento? (mes/día/año)"
    },
    error_date_of_birth: {
        en: "Please enter your date of birth as month/day/year",
        es: "Por favor, ingrese su fecha de nacimiento como mes/día/año"
    },
    msg_date_of_birth_appears_bogus: {
        en: 'Are you sure you didn\'t make a typo on that birthday? Say \'go back\' if you need to correct it',
        es: "¿Seguro de que escribió correctamente esa fecha? Si no, diga \'regresar\' si la necesita corregir"
    },
    prompt_will_be_18: {
        en: "Are you 18 or older, or will you be by the date of the election? (yes/no)",
        es: "¿Tiene 18 años de edad o más, o tendrá 18 años el día de las elecciones?"
    },
    prompt_email: {
        en: "Almost done! We'll now send your registration form and crucial voting information. What's your email?",
        es: "¡Casi terminamos! Ahora vamos a enviar su formulario de inscripción y información de votación muy importante. ¿Cuál es su correo electrónico?"
    },
    error_email: {
        en: "Please enter your email address. If you don't have one, reply SKIP",
        es: "Por favor, ingrese su correo electrónico. Si no tiene uno, responda SALTAR"
    },
    prompt_confirm_name_address: {
        en: 'The name and address I have for you is:\n{{first_name}} {{last_name}}, {{settings.address}} {{settings.address_unit}} {{settings.city}} {{settings.state}}\nIs this correct (yes/no)?',
        es: "El nombre y la dirección que yo tengo para usted es: \n{{first_name}} {{last_name}}, {{settings.address}} {{settings.address_unit}} {{settings.city}} {{settings.state}}\n Es correcto (si/no)?"
    },
    error_confirm_name_address: {
        en: 'Please reply "yes" or "no" to confirm your information',
        es: "Por favor, responde \"si\" o \"no\" para confirmar su información"
    },
    msg_already_registered: {
        en: 'Awesome! Our data says you\'re already registered to vote at that address!',
        es: "¡Felicidades! Nuestros datos dicen que ya esta registrado para votar en esta dirección."
    },
    msg_not_yet_registered: {
        en: 'I checked a national voter registration database, and can\'t confirm your registration at that address. Let\'s get you registered, just to be sure!',
        es: "Revise la base de datos nacional de registro de votantes, y no pude confirmar su inscripción en esta dirección. Vamos a procesar su registro para asegurarnos de que todo este listo."
    },
    msg_complete: {
        en: "Congratulations! I have submitted your voter registration in {{settings.state}}! We just emailed you a receipt.",
        es: "¡Felicidades! He sometido su inscripción de votante. Acabamos de enviarle un recibo por correo electrónico."
    },
    prompt_incomplete: {
        en: "Sorry, your registration is incomplete. Say RETRY to try again, RESTART to start over",
        es: "Lo siento su inscripción no se pudo procesar. Diga PROCESA DE NUEVO para procesarlo otra vez, o EMPEZAR DE NUEVO para empezar desde el principio"
    },
    msg_share: {
        en: "Help your friends get registered -- please share HelloVote!\n* Share on Facebook: hellovote.org/share\n* Share on Twitter: {tweet_url}",
        es: "Porfavor comparta HolaVote!\n* Comparta en Facebook: https://hellovote.org/share\n* Comparta en Twitter: {tweet_url}"
    },
    msg_share_sms: {
        en: "Forward this message to everyone you care about! Register to vote by text message: Text HELLO to sms:384-387 or visit https://hello.vote",
        es: "¡Reenvíe el mensaje siguiente a sus amigos! Registrese para votar por mensaje de texto: Envia HOLA por SMS a 384-387 o visite https://hello.vote"
    },
    msg_sms_notice: {
        en: "Fight for the Future (FFTF) & its Education Fund (FFTFEF) will text you voting information and other action alerts. To stop messages, text STOP to 384387.",
        es: "Fight for the Future (FFTF) y su Fondo de Educación (FFTFEF) le enviará información de votante y otras alertas de acción. Para anular su suscripción envíe STOP a 384387. "
    },
    msg_sms_notice_partner: {
        en: "Fight for the Future (FFTF), its Education Fund (FFTFEF) & {{partner}} will text you voting information and other action alerts.",
        es: "Fight for the Future (FFTF), su Fondo de Educación (FFTFEF), y {{partner}} le enviará información de votante y otras alertas de acción."
    },
    msg_sms_fftf_stop: {
        en: "(To stop messages from FFTF & FFTFEF, text STOP to 384387.)",
        es: "(Para detener mensajes de FFTF & FFTFEF, envíe STOP a 384387.)"
    },
    msg_share_facebook_messenger: {
        en: "Now, there's one last important thing. Please pass on the <3 and register some friends! Tap the button below to share me on Facebook.",
        es: "Ahora hay una última cosa importante. Por favor, difunde el <3 y registre algunos amigos! Haga click en el botón abajo para compartir en Facebook"
    },
    prompt_restart: {
        en: "This will restart your HelloVote registration! Reply OK to continue or BACK to go back.",
        es: "Esto va a empezar de nuevo tu inscripción HolaVote! Responde SI para continuar o REGRESA para regresar"
    },
    prompt_us_citizen: {
        en: "Are you a US citizen? (yes/no)",
        es: "¿Eres un ciudadano de los Estados Unidos? (si/no)"
    },
    prompt_legal_resident: {
        en: "Are you a current legal resident of {{settings.state}}? (yes/no)",
        es: "¿Eres un residente legal de {{settings.state}}? (si/no)"
    },
    prompt_military_or_overseas: {
        en: "Are you a military or overseas voter? (military/overseas/no)",
        es: "“¿Eres un votante militar o del el extranjero? (militar/extranjero/no)"
    },
    error_military_or_overseas: {
        en: "Sorry, I didn't get that. Please answer (military/overseas/no)",
        es: "Lo siento, no entendí eso. Por favor contesta (militar/extranjero/no)"
    },
    prompt_ethnicity: {
        en: "What is your ethnicity or race? (asian-pacific/black/hispanic/native-american/white/multi-racial/other)",
        es: "¿Cuál es su origen étnico o raza? (asiático o isleño del pacífico / negro / hispano / indígena norteamericano / blanco / multi-racial / otro)"
    },
    error_ethnicity: {
        en: "Please let me know your ethnicity or race.",
        es: "Por favor dígame su origen étnico o raza."
    },
    prompt_political_party: {
        en: "What's your party preference? This is optional. (democrat/republican/libertarian/green/other/none)",
        es: "¿Cuál es su preferencia de partido? Esto es opcional. (demócrata/republicano/libertario/verde/otro/ninguno)"
    },
    error_political_party: {
        en: "Please let me know your party preference, so I can ensure you are registered correctly.",
        es: "Por favor digame su preferencia de partido para asegurar que seá registrado correctamente."
    },
    prompt_other_political_designation: {
        en: "Please name your political party, and we'll try to match it to the list of political designations in {{settings.state}}.",
        es: "Por favor digame su partido preferido y vamos a tratar de emparejarlo con la lista de partidos políticos en {{settings.state}}."
    },
    prompt_disenfranchised: {
        en: "Have you been disenfranchised from voting, or are you currently imprisoned or on parole for the conviction of a felony? (yes/no)",
        es: "¿Ha sido privado de su derecho a votar, o está actualmente encarcelado o en libertad condicional por la convicción de un delito grave? (si/no)"
    },
    prompt_disqualified: {
        en: "Are you under guardianship which prohibits your registering to vote, or are you disqualified because of corrupt practices in respect to elections? (yes/no)",
        es: "Está usted bajo la tutela que prohíbe su inscripción para votar, o está descalificado a causa de prácticas corruptas en relación con las elecciones?"
    },
    prompt_incompetent: {
        en: "Have you been found legally incompetent in your state? (yes/no)",
        es: "¿Ha sido encontrado incompetente por la ley en su estado? (si/no)"
    },
    prompt_phone: {
        en: "What's your phone number?",
        es: "¿Cuál es tu número de teléfono?"
    },
    error_phone: {
        en: 'Sorry, that wasn\'t a valid phone number. Please format like 510-555-1212',
        es: "Lo siento, eso no era un número válido. Por favor formateelo como 510-555-1212"
    },
    prompt_state_id_number: {
        en: "What's your driver's license or state ID number? If you don't have one, reply \"none\" ({{settings.state}} needs this info to process your voter registration)",
        es: "Por favor, ingrese su número de licencia de conducir o número de identificación oficial del estado. Si no tiene, responda \"ninguno\" ({{settings.state}} necesita esta información para terminar su inscripción)"
    },
    error_state_id_number: {
        en: "Please enter your state ID or driver's license number",
        es: "Por favor, ingrese su número de licencia de conducir o número de identificación oficial del estado"
    },
    prompt_state_id_issue_date: {
        en: "What date was your state ID/driver's license issued? (mm/dd/yyyy)",
        es: "¿En qué fecha se emitió su licencia/identificación? (mm/dd/aaaa)"
    },
    prompt_ssn: {
        en: "One more thing - in order to finish your registration, your state wants to know your social security number.",
        es: "Una cosa más - para terminar su inscripción, su estado quiere saber su número de seguro social."
    },
    prompt_ssn_last4: {
        en: "Your state also wants to know the last 4 digits of your social security number.",
        es: "Su estado también quiere saber los últimos cuatro dígitos de su número de seguro social."
    },
    error_ssn_last4: {
        en: "Please enter the last 4 digits of your social security number.",
        es: "Por favor ingrese los últimos cuatro dígitos de su número de seguro social."
    },
    prompt_state_id_or_ssn_last4: {
        en: "Ok, if you don't have a {{settings.state}} ID, your state wants to know the last 4 digits of your social security number.",
        es: "Bueno, si no tiene una licencia/identificación de {{settings.state}}, su estado quiere saber los últimos cuatro dígitos de su número de seguro social."
    },
    prompt_state_id_or_full_ssn: {
        en: "OK, if you don't have a {{settings.state}} ID, your state wants to know your social security number.",
        es: "Bueno, si no tiene una licencia/identificación de {{settings.state}}, su estado quiere saber su número de seguro social."
    },
    prompt_gender: {
        en: "What's your gender?",
        es: "¿Cuál es su género?"
    },
    prompt_county: {
        en: "What county do you reside in?",
        es: "¿En qué país usted reside?"
    },
    error_county: {
        en: "Please enter the name of the county you reside in",
        es: "Por favor ingrese el nombre del país donde usted reside"
    },
    prompt_consent_use_signature: {
        en: "To submit your registration directly with the state, I can use your signature on file with the DMV. Is this ok? (yes/no)",
        es: "Para entregar su inscripción directamente a el estado, puedo usar su firma que está en los archivos del DMV. Esta bien?"
    },
    error_consent_use_signature: {
        en: "Please reply YES to let me submit your registration using your signature from the DMV. I do not keep this information.",
        es: "Por favor responde SI para autorizar el uso de su firma del DMV. Yo no guardo esta información."
    },
    prompt_vote_by_mail: {
        en: "Would you like to vote by mail-in ballot?",
        es: "¿Quieres votar por correo?"
    },
    prompt_fftf_opt_in: {
        en: "Would you like to receive emails from us as well (you can unsubscribe at any time)? (yes/no)",
        es: "¿Le gustaría recibir correos electrónicos de nosotros también (puede cancelar en cualquier momento)?"
    },
    msg_fftf_opt_in_thanks: {
        en: "Thanks for joining us at Fight for the Future!",
        es: "¡Gracias por unirse a Fight for the Future!"
    },
    prompt_ineligible: {
        en: "Sorry--based on your answer, you\'re not eligible to vote. Plz say BACK if you need to make a correction. Or, say YES and I can help your friends get registered!",
        es: "Lo sentimos -- en base a sus respuestas, usted no es elegible para votar. Por favor diga REGRESAR si necesita corregir algo, o SI y ¡puedo ayudarle a registrar a sus amigos!"
    },
    error_validate_date: {
        en: 'I didn\'t understand that date. Please format like MM/DD/YYYY',
        es: "No entendí esa fecha. Por favor formateela como mm/dd/aaaa"
    },
    error_validate_phone: {
        en: 'Sorry, that wasn\'t a valid phone number. Please format like 510-555-1212',
        es: "Lo siento, eso no era un número válido. Por favor, formateelo como 510-555-1212"
    },
    error_validate_email: {
        en: 'I need your email address to send you a registration receipt and voting reminders. If you don\'t have one, reply NONE.',
        es: "Necesito su correo electrónico para enviarle un recibo de inscripción y una notificación para votar. Si no tiene un correo electrónico, responde NINGUNO"
    },
    error_validate_boolean_yes: {
        en: 'Please answer yes or no',
        es: "Por favor, contesta si o no"
    },
    warning_validate_boolean_yes: {
        en: 'Are you sure? If you don\'t answer "yes", you can\'t register to vote in your state.',
        es: "¿Está seguro? Si no contesta \"si\", no puede registrarse para votar en su estado"
    },
    warning_validate_boolean_no: {
        en: 'Are you sure? If you don\'t answer "no", you can\'t register to vote in your state.',
        es: "¿Está seguro? Si no contesta \"no\", no puede registrarse para votar en su estado"
    },
    error_validate_state_abbreviation: {
        en: 'That\'s not a valid state abbreviation. Please enter only 2 letters.',
        es: "Eso no es una abreviatura del estado válida. Por favor ingrese solo 2 letras."
    },
    error_validate_state_name: {
        en: 'That\'s not a valid state name.',
        es: "Eso no es un nombre de estado válido."
    },
    error_validate_zip: {
        en: 'That\'s not a valid zip code. Please enter only 5 numbers.',
        es: "Eso no es un código postal válido. Por favor, ingrese solo 5 dígitos."
    },
    error_validate_zip_is_bogus: {
        en: 'I couldn\'t find that zip code',
        es: "No pude encontrar ese código postal."
    },
    error_validate_address: {
        en: 'Please enter your mailing address.',
        es: "Por favor ingrese su dirección."
    },
    error_validate_address_is_bogus: {
        en: 'Sorry, I couldn\'t look up your address. Please check if it was correct, and say it again.',
        es: "Lo siento, no encontré su dirección. Por favor verifíquelo y dilo otra vez."
    },
    error_validate_apartment: {
        en: 'I couldn\'t verify that apartment number. Please try again.',
        es: "No pude verificar su número de apartamento. Por favor trate de nuevo."
    },
    error_validate_gender: {
        en: 'Please enter your gender as male or female',
        es: "Por favor ingrese su género como masculino o femenino"
    },
    error_validate_military_or_overseas: {
        en: "Sorry, I didn't get that. Please answer (military/overseas/no)",
        es: "Lo siento, no entendí eso. Por favor contesta (militar/extranjero/no)"
    },
    error_validate_ssn: {
        en: 'Please enter your social security number like 123-45-6789',
        es: "Por favor ingrese su número de seguro social como 123-45-6789"
    },
    error_validate_ssn_last4: {
        en: 'Please enter just the last 4 digits of your social security number',
        es: "Por favor ingrese solo los ultimos 4 digitos de su número de seguro social."
    },
    error_validate_state_id_number: {
        en: 'Please enter a valid {{settings.state}} ID. If you don\'t have one, reply "NONE" and we will try something else.',
        es: "Por favor ingrese una identificación de {{settings.state}} válida. Si no tiene una, yo no puedo entregar su inscripción. Responde NINGUNO y yo le enviaré un formulario que puede imprimir y mandar por correo."
    },
    error_state_deadline_expired: {
        en: 'Sorry, the online voter registration deadline for {{settings.state}} has passed.',
        es: "Lo siento, la fecha límite de inscripción para votar en {{settings.state}} ha pasado."
    },
    error_validate_state_abbreviation: {
        en: 'Sorry, that\'s not a valid US state abbreviation.',
        es: "Lo siento, eso no es un abreviatura de estado válido."
    },
    error_validate_state_name: {
        en: 'Sorry, that\'s not a valid US state name.',
        es: "Lo siento, eso no es un nombre de estado válido."
    },
    msg_happy_birthday: {
        en: 'Happy birthday! \u{1F382}',
        es: "¡Feliz cumpleaños! \u{1F382}"
    },
    prompt_email_for_ovr: {
        en: "I'm about to look up your registration status and send you crucial voting info. What's your email address?",
        es: "Estoy a punto de revisar el estado de su registro y también le enviare información de votación importante. ¿Cuál es su dirección de correo electrónico?"
    },
    prompt_email_for_pdf: {
        en: "I'm about to look up your registration status and send you crucial voting info. What's your email address?",
        es: "Estoy a punto de revisar el estado de su registro y también de enviarle información de votación importante. ¿Cuál es su dirección de correo electrónico?"
    },
    prompt_email_for_gotv: {
        en: "I'm about to send you crucial voting info. What's your email address?"
    },
    msg_complete_ovr: {
        en: 'HelloVote just submitted your information to {{settings.state}}\'s online voter registration system, and I sent you an email receipt (be sure to read it!)',
        es: "HolaVote entregó su inscripción para votar en {{settings.state}}. Acabamos de enviarle un recibo por correo electrónico (¡asegúrese de leerlo!). "
    },
    msg_complete_ovr_disclaimer: {
        en: 'Don\'t assume you\'re registered until you confirm with your state: hellovote.org/confirm/#{{settings.state}} - it may take days or weeks, but plz check! Your vote is important!',
        es: "No suponga que esta registrado hasta que lo confirme con su estado: hellovote.org/confirm/#{{settings.state}} - se puede tardar días o semanas, pero reviselo por favor. ¡Su voto es importante!"
    },
    msg_complete_pdf: {
        en: "Great, now this is super important. We just emailed you a form. You **must** print, sign, and mail it, or you won't be registered! The deadline for {{settings.state}} is {{deadline}}.",
        es: "Bien, ahora esto es super importante. Acabamos de mandarle un correo electrónico con el formulario. **Debe imprimir, firmar y enviarlo por correo** o usted no sera registrado. La fecha límite para {{settings.state}} es {{deadline}}."
    },
    msg_complete_pdf_fb: {
        en: "Here's your voter registration form (I also emailed you a copy!) You **must** print, sign, and mail it, or you won't be registered. The deadline for {{settings.state}} is {{deadline}}.",
        es: "Aqui esta su formulario de inscripcion (tambien le envie una copia por correo electrónico). **Debe imprimir, firmar y enviarlo por correo** o usted no sera registrado. La fecha límite para {{settings.state}} es {{deadline}}."
    },
    msg_complete_mail: {
        en: "I'm mailing your form now! It should arrive by {{mail_eta}}. Once it does, you **must** sign & mail it, or you won't be registered! The deadline for {{settings.state}} is {{deadline}}",
        es: "¡Estoy enviando su formulario ahora! Debe llegar por {{mail_eta}}. Cuando lo reciba, **debe imprimir, firmar y enviarlo por correo** o usted no sera registrado. La fecha límite para {{settings.state}} es {{deadline}}."
    },
    msg_ovr_failed: {
        en: 'Hmm, something went wrong when I tried to submit through the {{settings.state}} Online Voter Registration system, but no worries. We can do it the old-fashioned way.',
        es: "Hmm, algo salió mal cuando intente enviarlo a través del Sistema de Registro Electoral de {{settings.state}} en línea, pero no se preocupe. Podemos hacerlo de la manera antigua."
    },
    frag_soon: {
        en: 'soon',
        es: 'pronto'
    },
    prompt_choose_nvra_delivery: {
        en: "OK - I can mail your voter registration form to you, but it'll take a few days & deadlines are approaching! Can you print it yourself instead? (yes/no)",
        es: "OK - puedo enviarle el formulario de registro por correo, pero va a tomar un par de días y las fechas límite se están acercando! ¿Lo puede imprimir usted mismo? (si/no)"
    },
    error_incomplete: {
        en: 'Sorry, your registration is missing a required field.',
        es: "Lo siento, a su inscripción le falta una sección requerida."
    },
    error_incomplete_you_are_missing: {
        en: 'You are missing:',
        es: "Le falta:"
    },
    msg_trying_again: {
        en: 'Sending your registration again.',
        es: "Estoy enviando su inscripción otra vez."
    },
    prompt_restart_after_complete: {
        en: 'We\'re all done. Would you like to start again? (yes/no)',
        es: "Ya terminamos. Quiere empezar de nuevo? (si/no)"
    },
    msg_unsubscribed: {
        en: 'You are unsubscribed from Fight for the Future and Education Fund. No more messages will be sent. Email team@hello.vote to restart.',
        es: "Usted anuló su suscripción de Fight for the Future. No va a recibir más mensajes. Email team@hello.vote para reiniciar."
    },
    msg_unsubscribed_default: {
        en: 'You are unsubscribed from Fight for the Future. No more messages will be sent. Email team@hello.vote for help or to restart.',
    },
    msg_help: {
        en: 'To go back a step, say BACK. To unsubscribe, say STOP. To start over, re-enter your # on hellovote.org. All other questions, email team@hello.vote',
        es: "Para regresar, diga REGRESAR. Para anular su suscripción, diga STOP. Para volver a empezar, re-ingrese su # en holavote.org. Para otras preguntas envíe un mensaje a team@hello.vote"
    },
    msg_help_default: {
        en: 'Fight for the Future. Help at team@hello.vote or 855-447-3383. Msg&data rates may apply. 4 msgs/month. To unsubscribe, text STOP',
    },
    msg_try_again: {
        en: 'Please try again!',
        es: "¡Por favor pruebe otra vez!"
    },
    msg_error_unknown: {
        en: 'I seem to have had a glitch. Please send your last message again.',
        es: "Ocurrió una falla. Por favor envíe su último mensaje otra vez."
    },
    msg_error_failed: {
        en: 'Agh, an error occurred and your voter registration could not be processed. Please let us know: team@hellovote.org - reference #',
        es: "¡Ay! Un error occurio y su inscripción para votar no pudo ser procesada. Por favor avísenos: team@hellovote.org - # de referencia  "
    },
    msg_processing: {
        en: 'One moment please...',
        es: "Un momento por favor..."
    },
    msg_address_appears_bogus: {
        en: '(FYI - I couldn\'t look up that address. Are you sure you didn\'t make a typo? If you need to correct it, say "BACK" to go back :)',
        es: "(No pude encontrar esa dirección. Está seguro que la información que ingresó es correcta?"
    },
    prompt_ovr_disclosure: {
        en: 'In order to continue, you must agree to the following statement',
        es: "Para continuar, debe estar de acuerdo con la declaración siguiente."
    },
    prompt_confirm_ovr_disclosure: {
        en: 'Do you agree? Say YES or NO (If you couldn\'t read it, click here {url})',
        es: "¿Está de acuerdo? Diga SI o NO (Si no pudo leerla, haga click aquí {url}"
    },
    prompt_has_previous_address: {
        en: 'Have you previously been registered under a different address in {{settings.state}}?',
        es: "¿Ha sido registrado previamente bajo una dirección diferente en {{settings.state}}?"
    },
    prompt_previous_address: {
        en: 'OK. Please say your full previous address **including** apartment number, city, state and zip code. (Reply SKIP if you didn\'t change your address)',
        es: "Bueno. Por favor diga su dirección anterior completa, **incluyendo** la ciudad, estado, y código postal. (Responda SALTAR si no cambio su dirección)"
    },
    prompt_previous_address_street: {
        en: 'Arg, I\'m sorry but I couldn\'t look up that address. Can you break it down for me? Please say just the number & street portion of that address (eg. 123 Main St.)',
        es: "¡Ay! Lo siento pero no puedo encontrar esa dirección. ¿La puede enviar en partes? Por favor solo ingrese su dirección de calle (por ejemplo: 123 Main St.)"
    },
    prompt_previous_address_unit: {
        en: 'Alright, and what\'s the apartment number? (If you didn\'t have one, reply NONE)',
        es: "¿Cuál es su número de apartamento? (Si no tienes uno, responde: ninguno)"
    },
    prompt_previous_city: {
        en: 'What city were you previously registered to vote in?',
        es: "¿En cual ciudad estuvo previamente registrado para votar?"
    },
    prompt_previous_state: {
        en: 'What state were you previously registered to vote in?',
        es: "¿En cual estado estuvo previamente registrado para votar?"
    },
    prompt_previous_zip: {
        en: 'What zip code were you previously registered to vote in?',
        es: "¿En cual codigo postal estuvo previamente registrado para votar?"
    },
    prompt_previous_county: {
        en: 'And finally, what county was your previous address in?',
        es: "Y por último, ¿en qué país tuvo su dirección anterior?"
    },
    prompt_has_previous_name: {
        en: 'Alright then, have you been registered to vote in {{settings.state}} under a different name?',
        es: "Entonces bueno, ha sido registrado para votar en {{settings.state}} bajo un nombre diferente?"
    },
    prompt_previous_name: {
        en: 'What name were you previously registered under? (Reply SKIP if you didn\'t change your name)',
        es: "Bueno. Por favor diga el nombre completo bajo el cual estaba registrado previamente. (Responda SALTAR si no cambio su nombre)"
    },
    prompt_has_previous_name_address: {
        en: 'Were you previously registered to vote under a different name or address? (yes/no)',
        es: "¿Estuvo previamente registrado para votar con un nombre o una dirección diferente? (si/no)"
    },
    prompt_has_separate_mailing_address: {
        en: 'Do you receive mail at a different address than your residential address?',
        es: "¿Usted recibe correo a una dirección diferente a la de su domicilio?"
    },
    prompt_separate_mailing_address: {
        en: 'OK. Please say your full mailing address including city, state and zip code.',
        es: "Bueno. Por favor diga su dirección completa, incluyendo la ciudad, estado, y código postal."
    },
    prompt_change_state: {
        en: 'Are you currently registered to vote in any other state? If so, say it here. If not, say "NO".',
        es: "¿Está actualmente registrado para votar en cualquier otro estado? Si es así, digalo aquí. Si no es así, diga NO"
    },
    button_register_to_vote: {
        en: 'Register to vote',
        es: "Inscríbirme para votar"
    },
    button_register_my_friends: {
        en: 'Register my friends',
        es: "Inscribir a mis amigos"
    },
    button_learn_more: {
        en: 'Learn more...',
        es: "Más información..."
    },
    prompt_facebook_get_started_share: {
        en: 'OK! I can get your friends registered to vote right from Facebook Messenger. Tap the button below to share me with your friends!',
        es: "¡Ok! Puedo registrar a sus amigos para votar en Facebook Messenger. Haga click en el botón de abajo para compartirlo con sus amigos!"
    },
    button_share: {
        en: 'Share HelloVote!',
        es: "¡Compartir HolaVote!"
    },
    prompt_nudge: {
        en: 'Still there? Your voter registration isn\'t finished yet. Say "Yes" to continue, or "Stop" to unsubscribe.',
        es: "¿Sigue ahí? Su inscripción todavía no está completa. Diga \"SI\" para continuar o \"STOP\" para anular su suscripción."
    },
    prompt_az_pevl: {
        en: "Would you like to be added to the Permanent Early Voter List? It's the easiest way to vote from home."
    },
    prompt_choose_postage: {
        en: "Last question: I can include a stamp on your form, but it costs me 47 cents. Do you need a stamp? (yes/no)"
    },
    error_deadline_expired_but_in_person_allowed: {
        en: 'Sorry, the voter registration deadline has passed. Fortunately {{settings.state}} allows in-person registration before Election Day.'
    },
    msg_refer_external_ovr: {
        en: 'To complete your voter registration online, please visit {url}'
    },
    msg_warning_deadline_very_close: {
        en: 'WARNING - {{deadline}}. I can help you print and mail your form, but you should send it today!'
    },
    msg_you_must_mail: {
        en: 'OK - I\'m about to send you an email with your voter registration form. We\'re super close to the deadline, so you should print, sign and mail it today!'
    },
    msg_ovr_failed_no_fallback: {
        en: 'I\'m so sorry. Something went wrong & I couldn\'t automatically send your registration through {{settings.state}}\'s online system. The deadline is soon, so please register online',
    },
    msg_intro_line_api: {
        en: 'HelloVote is managed by Fight for the Future and its Education Fund. Please see the link below for more  information regarding the handling of personal information LINE Corp provided to the Account Manager and any personal information you provide to the Account Manager.\nhttp://me2.do/IFN3hLvD',
    },
    prompt_early_voting: {
        en: 'Early voting has started in your state! When are you going to vote?'
    },
    msg_lookup_polling_location: {
        en: 'OK. Let\'s get your address so I can look up your polling location.'
    },
    msg_ev_polling_url: {
        en: 'Great! Get directions to your polling place here: {url}'
    },
    prompt_mail_in: {
        en: '{{settings.state}} is a vote-by-mail state. Have you mailed in your ballot yet? (yes/no)'
    },
    msg_mail_your_ballot: {
        en: 'Please mail your ballot soon - the deadline is coming up! Once you\'ve voted, you can say "I VOTED" and something amazing will happen!',
    },
    msg_share_gotv: {
        en: "Get your friends to the polls -- please share HelloVote!\n* Share on Facebook: {share_url}\n* Share on Twitter: {tweet_url}",
    },
    msg_share_sms_gotv: {
        en: "Forward this message to everyone you care about! Register to vote and get to the polls: Text HELLO to sms:384-387 or visit https://hello.vote",
        es: "¡Reenvíe el mensaje siguiente a sus amigos! Registrese para votar por mensaje de texto: Envia HOLA por SMS a 384-387 o visite https://hello.vote"
    },
    msg_i_voted_selfie: {
        en: "Awesome! Get your 'I VOTED' selfie badge to show your friends & get them to the polls! Visit https://i-voted.hello.vote"
    },
    prompt_commit_to_vote: {
        en: "Hey {{first_name}}, are you ready to vote on Tuesday, Election Day? We can send you a calendar invite, so you can make time to get to the polls."
    },
    prompt_zip_gotv: {
        en:  "Now, what's your zip code? To get your Election Day info, we need to know where you're registered to vote.",
    },
    msg_calendar_invite: {
        en: "Okay, I've just sent you a calendar invite by email. I'll send you all the info you need in the coming days."
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
