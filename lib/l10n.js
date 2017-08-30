var l10n = {
    msg_intro: {
        en: "Hi, this is HelloVote! I can send you everything you need to go vote, and help you invite friends too! Your answers are private & secure. hellovote.org",
        es: "Saludos, esto es HelloVote. Yo puedo ayudarle a registrarse para votar, recuerda a votar, y recuerde a sus amigos a ver demasiado. Sus respuestas seran privadas y seguras. hellovote.org"
    },
    msg_intro_facebook_get_started: {
        en: 'Hi, I\'m HelloVote! I can send you everything you need to go vote, and help you invite friends too! Your answers are private & secure.',
        es: "Saludos, soy HolaVote. Yo puedo ayudarle a registrarse para votar con solo unos mensajes. Si ya està registrado ¡también puedo ayudar a sus amistades!"
    },
    msg_intro_facebook: {
        en: "OK, I can help you get to the polls!",
        es: "Bueno, yo puedo ayudarle a registrarse para votar. Le haré unas preguntas para completar el formulario de inscripción. Sus respuestas seran privadas y seguras."
    },
    prompt_first_name: {
        en: "So what's your first name? (Please use your legal first name as listed on your photo ID, so I can look up your voter registration status.)",
        es: "¿Cuál es su nombre? Este formulario es oficial, así que su nombre debe aparecer igual que en su identificación.",
        ko: "First name 을 입력 해 주세요 (시민권자가 되었을 때 사용한 이름)"
    },
    prompt_first_name_friendly: {
        en: "So what's your first name?",
        es: "¿Cuál es su nombre?",
        ko: "First name 을 입력 해 주세요 (시민권자가 되었을 때 사용한 이름)"
    },
    prompt_first_name_fb: {
        en: "So what's your first name? (Please use your legal first name as listed on your photo ID, so I can look up your voter registration status.)",
        es: "¿Cuál es su nombre? Este formulario es oficial, así que su nombre debe aparecer igual que en su identificación.",
        ko: "First name 을 입력 해 주세요 (시민권자가 되었을 때 사용한 이름)"
    },
    prompt_confirm_first_name: {
        en: "Just confirming - we'll ask your last name separately. So is your FIRST name \"{{first_name}}\"? (yes/no)",
        es: "Sólo confirmando - vamos a pedirle su apellido por separado. ¿Así que \"{{first_name}}\" es su nombre? (si/no)",
        ko: "이름 란에 단어를 두 개 입력하셨는데요, {{first_name}} 이 이름 부분(First Name)이 맞나요? (Yes/No)"
    },
    error_first_name: {
        en: "Please enter your first name",
        es: "Por favor ingrese su nombre",
        ko: "First name 을 입력 해 주세요"
    },
    prompt_last_name: {
        en: "OK {{first_name}}, what's your last name? Again, this needs to match your official information.",
        es: "Ok {{first_name}}, ¿Cual es su apellido? De nuevo, tiene que ser idéntico a su información oficial.",
        ko: "{{first_name}}님, 성(Last name)이 어떻게 되세요? (시민권자가 되었을 때 사용한 이름)"
    },
    error_last_name: {
        en: "Please enter your last name",
        es: "Por favor ingrese su apellido",
        ko: "Last name 을 입력 해 주세요"
    },
    prompt_zip: {
        en: "Got it. Now, what's your zip code? (By the way, you can say \"go back\" if you ever need to go back a step, or \"help\" for more options!)",
        es: "Lo tengo. Ahora, ¿cuál es su código postal? (A propósito, puedes decir \"regresar\" si quieres retroceder un paso o \"ayuda\" para más opciones)",
        ko: "ZIP Code 를 입력해주세요 (입력하다 잘못 입력 하면 “back” 이라고 답변하면 이전 질문을 다시 입력 할 수 있습니다."
    },
    error_zip: {
        en: "Please enter your five-digit zip code, or SKIP if you don't know it.",
        es: "Por favor, ingrese su código postal de cinco dígitos, o ingrese SALTAR si no lo sabe.",
        ko: "KO: 우편번호(ZIP Code)를 입력해주세요. 모르면 “Skip” 이라고 입력하세요"
    },
    prompt_city: {
        en: "What city do you live in?",
        es: "¿En qué ciudad vives?",
        ko:"거주하는 도시 이름을 입력 해주세요"
    },
    error_city: {
        en: "Please enter your city",
        es: "Por favor, ingrese su ciudad"
    },
    prompt_state: {
        en: "What state do you live in? (eg CA)",
        es: "¿En qué estado vive usted? (Por ejemplo, CA)",
        ko:"거주하는 주(State) 이름을 입력해주세요 (예: CA)"
    },
    error_state: {
        en: "Please enter your state",
        es: "Por favor, ingrese su estado",
        ko: "거주하는 주(State) 이름을 입력해주세요 (예: CA)"
    },
    prompt_address: {
        en: "What's your street address in {{settings.city}}, {{settings.state}}?",
        es: "¿Cual es su dirección en {{settings.city}}, {{settings.state}}?",
        ko: "{{settings.city}}, {{settings.state}} 에 살고 계시는 군요! 집 주소를 입력 해 주세요"
    },
    error_address: {
        en: "Please enter just your street address, not the city or state.",
        es: "Por favor, ingrese su dirección de calle, no la ciudad o estado",
        ko: "주소에서 첫 줄만을 입력 해 주세요. (도시와 주는 입력하지 마세요)"
    },
    prompt_apartment: {
        en: "What\'s your apartment number? (If you don't have one, reply: none)",
        es: "¿Cuál es su número de apartamento? (Si no tiene uno, responda: ninguno)",
        ko: "아파트 호수를 입력 해 주세요 (없으면 “none” 이라고 입력 해 주세오)"
    },
    error_apartment: {
        en: "Please enter an apartment number",
        es: "Por favor, ingrese su número de apartamento",
        ko: "아파트 번지 수를 입력 해 주세요"
    },
    prompt_date_of_birth: {
        en: "What day were you born? (month/day/year)",
        es: "Cual es su fecha de nacimiento? (mes/día/año)",
        ko: "생년월일을 입력 해 주세요 (월/일/연도 - 예: 10/1/1960) (MM/DD/YYYY)"
    },
    error_date_of_birth: {
        en: "Please enter your date of birth as month/day/year",
        es: "Por favor, ingrese su fecha de nacimiento como mes/día/año",
        ko: "생년월일을 입력 해 주세요 (형태: 10/30/1960 )"
    },
    msg_date_of_birth_appears_bogus: {
        en: 'Are you sure you didn\'t make a typo on that birthday? Say \'go back\' if you need to correct it',
        es: "¿Seguro de que escribió correctamente esa fecha? Si no, diga \'regresar\' si la necesita corregir",
        ko: "생년월일을 입력하면서 월/일/연도 양식으로 입력하지 않으셨나요? 생년월일을 수정하기 위해서는 “back” 이라고 입력 해 주세요"
    },
    prompt_will_be_18: {
        en: "Are you 18 or older, or will you be by the date of the election? (yes/no)",
        es: "¿Tiene 18 años de edad o más, o tendrá 18 años el día de las elecciones?",
        ko: "현재 성인 (18살 이상 또는 18살) 이거나 선거 당일 날이 될 때까지 성인이 됩니까?"
    },
    prompt_email: {
        en: "Almost done! We'll now send your registration form and crucial voting information. What's your email?",
        es: "¡Casi terminamos! Ahora vamos a enviar su formulario de inscripción y información de votación muy importante. ¿Cuál es su correo electrónico?",
        ko: "거의 다 끝났습니다! 유권자 등록 양식과 중요한 정보를 보내드리겠습니다. 이메일 주소를 입력 해 주세요."
    },
    error_email: {
        en: "Please enter your email address. If you don't have one, reply SKIP",
        es: "Por favor, ingrese su correo electrónico. Si no tiene uno, responda SALTAR",
        ko: "이메일 주소를 입력 해 주세요. 이메일이 없으면 “Skip” 이라고 입력 해 주세요."
    },
    prompt_confirm_name_address: {
        en: 'The name and address I have for you is:\n{{first_name}} {{last_name}}, {{settings.address}} {{settings.address_unit}} {{settings.city}} {{settings.state}}\nIs this correct (yes/no)?',
        es: "El nombre y la dirección que yo tengo para usted es: \n{{first_name}} {{last_name}}, {{settings.address}} {{settings.address_unit}} {{settings.city}} {{settings.state}}\n Es correcto (si/no)?",
        ko: "입력하신 이름과 주소를 확인 해 주세요:\n{{first_name}} {{last_name}}\n{{settings.address}} {{settings.address_unit}} {{settings.city}} {{settings.state}}\n맞습니까? (yes/no)?"
    },
    error_confirm_name_address: {
        en: 'Please reply "yes" or "no" to confirm your information',
        es: "Por favor, responde \"si\" o \"no\" para confirmar su información",
        ko: "정보가 맞으면 yes 라고 입력 해 주세요. (틀리면 no)"
    },
    msg_already_registered: {
        en: 'Awesome! Our data says you\'re already registered to vote at that address!',
        es: "¡Felicidades! Nuestros datos dicen que ya esta registrado para votar en esta dirección.",
        ko: "잘 되었습니다! 이미 유권자 등록이 되어 계십니다!"
    },
    msg_not_yet_registered: {
        en: 'I checked a national voter registration database, and can\'t confirm your registration at that address. Let\'s get you registered, just to be sure!',
        es: "Revise la base de datos nacional de registro de votantes, y no pude confirmar su inscripción en esta dirección. Vamos a procesar su registro para asegurarnos de que todo este listo.",
        ko: "유권자 데이터베이스를 확인 한 결과 이 주소에 등록이 되어계신 것을 확인하지 못했습니다. 혹시 모르니까, 등록하세요! (두번 등록한다고 해서 문제가 생기지는 않습니다)"
    },
    msg_complete: {
        en: "Congratulations! I have submitted your voter registration in {{settings.state}}! We just emailed you a receipt.",
        es: "¡Felicidades! He sometido su inscripción de votante. Acabamos de enviarle un recibo por correo electrónico.",
        ko: "{{settings.state}} 주의 유권자 등록 신청서를 제출하셨습니다! 지금 확인 이메일을 보내드렸습니다."
    },
    prompt_incomplete: {
        en: "Sorry, your registration is incomplete. Say RETRY to try again, RESTART to start over",
        es: "Lo siento su inscripción no se pudo procesar. Diga PROCESA DE NUEVO para procesarlo otra vez, o EMPEZAR DE NUEVO para empezar desde el principio",
        ko: "등록이 완료되지 않았습니다. 다시 시도하기 위해서는 RETRY 라고 입력하세요. 처음부터 다시 입력하기 위해서는 RESTART 라고 입력하세요."
    },
    msg_share: {
        en: "Help your friends get registered -- please share HelloVote!\n* Share on Facebook: hellovote.org/share\n* Share on Twitter: {tweet_url}",
        es: "Porfavor comparta HolaVote!\n* Comparta en Facebook: https://hellovote.org/share\n* Comparta en Twitter: {tweet_url}",
        ko: "HelloVote에 대해 주변에 홍보 해 주세요!\n* 페이스북 공유: hellovote.org/share \n* 트위터 공유: {tweet_url}"
    },
    msg_share_sms: {
        en: "Forward this message to everyone you care about! Register to vote by text message: Visit https://hello.vote",
        es: "¡Reenvíe el mensaje siguiente a sus amigos! Registrese para votar por mensaje de texto: Visite https://hello.vote",
        ko: "간편한 스마트폰 유권자 등록에 대해 널리 알려주세요! http://hello.vote 를 방문하시면 시작 할 수 있습니다."
    },
    msg_sms_notice: {
        en: "Fight for the Future (FFTF) & its Education Fund (FFTFEF) will text you voting information and other action alerts. To stop messages, text STOP.",
        es: "Fight for the Future (FFTF) y su Fondo de Educación (FFTFEF) le enviará información de votante y otras alertas de acción. Para anular su suscripción envíe STOP. ",
        ko: "이 앱의 주관 단체인 FFTF 및 FFTFEF (\“미래를 쟁취하자]\”) 에서 선거 정보를 포함한 여러가지 정보를 보내드릴 것입니다. 메세지를 그만 받기를 원하시면 STOP 을 입력하세요."
    },
    msg_sms_notice_partner: {
        en: "Fight for the Future (FFTF), its Education Fund (FFTFEF) & {{partner}} will text you voting information and other action alerts.",
        es: "Fight for the Future (FFTF), su Fondo de Educación (FFTFEF), y {{partner}} le enviará información de votante y otras alertas de acción.",
        ko: "이 앱의 주관 단체인 FFTF 및 FFTFEF (\“미래를 쟁취하자]\”) 에서 선거 정보를 포함한 여러가지 정보를 보내드릴 것입니다. "
    },
    msg_sms_fftf_stop: {
        en: "(To stop messages from FFTF & FFTFEF, text STOP.)",
        es: "(Para detener mensajes de FFTF & FFTFEF, envíe STOP.)",
        ko: "이 앱의 주관 단체인 FFTF 및 FFTFEF (\“미래를 쟁취하자]\”) 에서 보내드리는 정보를 그만 받기 위해서는 문자로 STOP 이라고 보내주세요"
    },
    msg_share_facebook_messenger: {
        en: "Now, there's one last important thing. Please pass on the <3 and register some friends! Tap the button below to share me on Facebook.",
        es: "Ahora hay una última cosa importante. Por favor, difunde el <3 y registre algunos amigos! Haga click en el botón abajo para compartir en Facebook",
        ko: "더 많은 사람들이 유권자 등록을 할 수 있도록 널리 알려주세요! 아래의 버튼을 눌러서 페이스북에서 공유 해 주세요."
    },
    prompt_restart: {
        en: "This will restart your HelloVote registration! Reply OK to continue or BACK to go back.",
        es: "Esto va a empezar de nuevo tu inscripción HolaVote! Responde SI para continuar o REGRESA para regresar",
        ko: "유권자 등록을 처음부터 다시 시작하시겠어요? 처음부터 시작하려면 ok, 이전 단계로 돌아가려면 back 을 입력 해 주세요."
    },
    prompt_us_citizen: {
        en: "Are you a US citizen? (yes/no)",
        es: "¿Eres un ciudadano de los Estados Unidos? (si/no)",
        ko: "미국 시민권자입니까? (Yes/no)"
    },
    prompt_legal_resident: {
        en: "Are you a current legal resident of {{settings.state}}? (yes/no)",
        es: "¿Eres un residente legal de {{settings.state}}? (si/no)",
        ko: "현재 {{settings.state}} 의 법적 주민입니까? (yes/no)"
    },
    prompt_military_or_overseas: {
        en: "Are you a military or overseas voter? (military/overseas/no)",
        es: "“¿Eres un votante militar o del el extranjero? (militar/extranjero/no)",
        ko: "군인 신분으로서 투표, 또는 미국 외 해외에서 투표를 하고자 하십니까? 군인이면 military, 해외 투표는 overseas, 둘 다 아니면 no 를 입력 해 주세요."
    },
    error_military_or_overseas: {
        en: "Sorry, I didn't get that. Please answer (military/overseas/no)",
        es: "Lo siento, no entendí eso. Por favor contesta (militar/extranjero/no)",
        ko: "효한 답변이 아닙니다. Military (군인), overseas (해외), no (둘 다 아님) 중에서 선택 해서 입력 해 주세요."
    },
    prompt_ethnicity: {
        en: "What is your ethnicity or race? (asian-pacific/black/hispanic/native-american/white/multi-racial/other)",
        es: "¿Cuál es su origen étnico o raza? (asiático o isleño del pacífico / negro / hispano / indígena norteamericano / blanco / multi-racial / otro)",
        ko: "인종 또는 민족이 어떻게 되시나요? 한국인이면 API, 그 외는 black, latino, native-american, white, multi-racial, other 중에서 선택 해 주세요."
    },
    error_ethnicity: {
        en: "Please let me know your ethnicity or race.",
        es: "Por favor dígame su origen étnico o raza.",
        ko: "인종 또는 민족의 이름을 입력 해 주세요"
    },
    prompt_political_party: {
        en: "What's your party preference? This is optional. (democrat/republican/libertarian/green/other/none)",
        es: "¿Cuál es su preferencia de partido? Esto es opcional. (demócrata/republicano/libertario/verde/otro/ninguno)",
        ko: "어느 정당을 선호하십니까? 민주당은 dem, 공화당은 rep, 선호하는 정당이 없으면 dts 를 입력하세요. 다른 군소 정당을 선호하시면 그 정당의 이름을 입력하세요."
    },
    error_political_party: {
        en: "Please let me know your party preference, so I can ensure you are registered correctly.",
        es: "Por favor digame su preferencia de partido para asegurar que seá registrado correctamente.",
        ko: "정당의 이름을 입력하시면 {{settings.state}} 에 자리잡은 정당 중에서 찾아서 확인허겠습니다."
    },
    prompt_other_political_designation: {
        en: "Please name your political party, and we'll try to match it to the list of political designations in {{settings.state}}.",
        es: "Por favor digame su partido preferido y vamos a tratar de emparejarlo con la lista de partidos políticos en {{settings.state}}.",
        ko: "투표권을 박탁당하거나 중범죄로 투옥되거나 가석방 되었습니까? (yes/no)"
    },
    prompt_disenfranchised: {
        en: "Have you been disenfranchised from voting, or are you currently imprisoned or on parole for the conviction of a felony? (yes/no)",
        es: "¿Ha sido privado de su derecho a votar, o está actualmente encarcelado o en libertad condicional por la convicción de un delito grave? (si/no)"
    },
    prompt_disqualified: {
        en: "Are you under guardianship which prohibits your registering to vote, or are you disqualified because of corrupt practices in respect to elections? (yes/no)",
        es: "Está usted bajo la tutela que prohíbe su inscripción para votar, o está descalificado a causa de prácticas corruptas en relación con las elecciones?",
        ko: "보호 대상이 되어 유권자 등록을 불허 당하거나 선거 관련 부정부패로 인해 투표 참여가 불허되어 있습니까?"
    },
    prompt_incompetent: {
        en: "Have you been found legally incompetent in your state? (yes/no)",
        es: "¿Ha sido encontrado incompetente por la ley en su estado? (si/no)",
        ko: "거주 주에서 법적으로 자체 결정을 못 한다는 진단을 받았습니까?"
    },
    prompt_phone: {
        en: "What's your phone number?",
        es: "¿Cuál es tu número de teléfono?",
        ko: "전화 번호를 입력하세요."
    },
    error_phone: {
        en: 'Sorry, that wasn\'t a valid phone number. Please format like 510-555-1212',
        es: "Lo siento, eso no era un número válido. Por favor formateelo como 510-555-1212",
        ko: "전화번호를 다음과 같은 형식으로 입력 해 주세요: 323-387-3718"
    },
    prompt_state_id_number: {
        en: "What's your driver's license or state ID number? If you don't have one, reply \"none\" ({{settings.state}} needs this info to process your voter registration)",
        es: "Por favor, ingrese su número de licencia de conducir o número de identificación oficial del estado. Si no tiene, responda \"ninguno\" ({{settings.state}} necesita esta información para terminar su inscripción)",
        ko: "운전면허증 또는 주 정부가 발급한 신분증 번호를 입력하세요."
    },
    error_state_id_number: {
        en: "Please enter your state ID or driver's license number",
        es: "Por favor, ingrese su número de licencia de conducir o número de identificación oficial del estado"
    },
    prompt_state_id_issue_date: {
        en: "What date was your state ID/driver's license issued? (mm/dd/yyyy)",
        es: "¿En qué fecha se emitió su licencia/identificación? (mm/dd/aaaa)",
        ko: "신분증 발급 날짜 (월/일/연)"
    },
    prompt_ssn: {
        en: "One more thing - in order to finish your registration, your state wants to know your social security number.",
        es: "Una cosa más - para terminar su inscripción, su estado quiere saber su número de seguro social.",
        ko: "유권자 등록읖 마감하기 위해서는 소셜시큐리티 번호가 필요합니다."
    },
    prompt_ssn_last4: {
        en: "Your state also wants to know the last 4 digits of your social security number.",
        es: "Su estado también quiere saber los últimos cuatro dígitos de su número de seguro social.",
        ko: "소셜번호의 마지막 4자리 수를 입력하세요"
    },
    error_ssn_last4: {
        en: "Please enter the last 4 digits of your social security number.",
        es: "Por favor ingrese los últimos cuatro dígitos de su número de seguro social."
    },
    prompt_state_id_or_ssn_last4: {
        en: "Ok, if you don't have a {{settings.state}} ID, your state wants to know the last 4 digits of your social security number.",
        es: "Bueno, si no tiene una licencia/identificación de {{settings.state}}, su estado quiere saber los últimos cuatro dígitos de su número de seguro social.",
        ko: "주 정부 ID 가 없으면 주 정부는 소셜 시큐리티 번호의 마지막 4자리 수를 요구합니다."
    },
    prompt_state_id_or_full_ssn: {
        en: "OK, if you don't have a {{settings.state}} ID, your state wants to know your social security number.",
        es: "Bueno, si no tiene una licencia/identificación de {{settings.state}}, su estado quiere saber su número de seguro social.",
        ko: "주 정부 ID 가 없으면 주 정부는 소셜 시큐리티 번호를 요구합니다. "
    },
    prompt_gender: {
        en: "What's your gender?",
        es: "¿Cuál es su género?",
        ko: "성별을 입력하세요"
    },
    prompt_county: {
        en: "What county do you reside in?",
        es: "¿En qué país usted reside?",
        ko: "거주하는 카운티 이름을 입력하세요"
    },
    error_county: {
        en: "Please enter the name of the county you reside in",
        es: "Por favor ingrese el nombre del país donde usted reside",
        ko: "거주하는 카운티 이름을 입력하세요"
    },
    prompt_consent_use_signature: {
        en: "To submit your registration directly with the state, I can use your signature on file with the DMV. Is this ok? (yes/no)",
        es: "Para entregar su inscripción directamente a el estado, puedo usar su firma que está en los archivos del DMV. Esta bien?",
        ko: "제 DMV에서 관리하는 서명 파일을 사용해서 유권자 등록 양식을 인증 할 차례입니다. 서명 파일 사용을 허가하기 위해서는 Yes 라고 입력 해 주세요."
    },
    error_consent_use_signature: {
        en: "Please reply YES to let me submit your registration using your signature from the DMV. I do not keep this information.",
        es: "Por favor responde SI para autorizar el uso de su firma del DMV. Yo no guardo esta información.",
        ko: "서명 파일 사용을 허가하기 위해서는 Yes 라고 입력 해 주세요. (서명 파일은 인증 용으로만 이용되며, 저희가 보관하지 않습니다)"
    },
    prompt_vote_by_mail: {
        en: "Would you like to vote by mail-in ballot?",
        es: "¿Quieres votar por correo?",
        ko: "투표를 우편으로 하시겠습니까?"
    },
    prompt_fftf_opt_in: {
        en: "Would you like to receive emails from us as well (you can unsubscribe at any time)? (yes/no)",
        es: "¿Le gustaría recibir correos electrónicos de nosotros también (puede cancelar en cualquier momento)?",
        ko: "저희 단체에서도 이메일을 받아보시겠어요? (언제든지 구독 취소를 할 수 있습니다)"
    },
    msg_fftf_opt_in_thanks: {
        en: "Thanks for joining us at Fight for the Future!",
        es: "¡Gracias por unirse a Fight for the Future!",
        ko: "저희 단체 \”미래를 쟁취하자\” 와 함께 해 주심을 감사드립니다."
    },
    prompt_ineligible: {
        en: "Sorry--based on your answer, you\'re not eligible to vote. Plz say BACK if you need to make a correction. Or, say YES and I can help your friends get registered!",
        es: "Lo sentimos -- en base a sus respuestas, usted no es elegible para votar. Por favor diga REGRESAR si necesita corregir algo, o SI y ¡puedo ayudarle a registrar a sus amigos!",
        ko: "답변하신 내용에 따르면 유권자 등록을 할 자격이 되지 않으십니다. 답변을 수정하기 위해서는 back 이라고 입력하세요. 이 앱에 대해 널리 알리는 것을 도와주시기 위해서는 yes 라고 답변하세요!"
    },
    error_validate_date: {
        en: 'I didn\'t understand that date. Please format like MM/DD/YYYY',
        es: "No entendí esa fecha. Por favor formateela como mm/dd/aaaa",
        ko: "날짜 형식을 월/일/연도(4자리) 으로 입력 해 주세요."
    },
    error_validate_phone: {
        en: 'Sorry, that wasn\'t a valid phone number. Please format like 510-555-1212',
        es: "Lo siento, eso no era un número válido. Por favor, formateelo como 510-555-1212",
        ko: "전화번호 형식을 000-000-0000 으로 입력 해 주세요."
    },
    error_validate_email: {
        en: 'I need your email address to send you a registration receipt and voting reminders. If you don\'t have one, reply NONE.',
        es: "Necesito su correo electrónico para enviarle un recibo de inscripción y una notificación para votar. Si no tiene un correo electrónico, responde NINGUNO",
        ko: "이메일 주소로 등록 확인 정보와 선거날 알림을 보내드릴 수 있습니다. 이메일 주소가 없으면 none 을 입력하세요"
    },
    error_validate_boolean_yes: {
        en: 'Please answer yes or no',
        es: "Por favor, contesta si o no",
        ko: "답변을 yes 또는 no 중에서 선택 해 주세요."
    },
    warning_validate_boolean_yes: {
        en: 'Are you sure? If you don\'t answer "yes", you can\'t register to vote in your state.',
        es: "¿Está seguro? Si no contesta \"si\", no puede registrarse para votar en su estado",
        ko: "\”Yes\” 라고 답변해야지만 거주 하는 주에서 투표하실 수 있습니다."
    },
    warning_validate_boolean_no: {
        en: 'Are you sure? If you don\'t answer "no", you can\'t register to vote in your state.',
        es: "¿Está seguro? Si no contesta \"no\", no puede registrarse para votar en su estado",
        ko: "변하신 내용에 따르면 그 주에서 유권자 등록을 하실 수 없습니다."
    },
    error_validate_state_abbreviation: {
        en: 'That\'s not a valid state abbreviation. Please enter only 2 letters.',
        es: "Eso no es una abreviatura del estado válida. Por favor ingrese solo 2 letras.",
        ko: "주(state) 는 두 글자 축약형으로 입력 해 주세요. (예: CA)"
    },
    error_validate_state_name: {
        en: 'That\'s not a valid state name.',
        es: "Eso no es un nombre de estado válido.",
        ko: "주 이름이 틀린 것 같습니다."
    },
    error_validate_zip: {
        en: 'That\'s not a valid zip code. Please enter only 5 numbers.',
        es: "Eso no es un código postal válido. Por favor, ingrese solo 5 dígitos.",
        ko: "유효한 우편번호(ZIP) 이 아닙니다. 5자리 수를 입력하세요."
    },
    error_validate_zip_is_bogus: {
        en: 'I couldn\'t find that zip code',
        es: "No pude encontrar ese código postal.",
        ko: "그 우편번호(ZIP)를 찾을 수 없습니다"
    },
    error_validate_address: {
        en: 'Please enter your mailing address.',
        es: "Por favor ingrese su dirección.",
        ko: "주소를 입력 해 주세요"
    },
    error_validate_address_is_bogus: {
        en: 'Sorry, I couldn\'t look up your address. Please check if it was correct, and say it again.',
        es: "Lo siento, no encontré su dirección. Por favor verifíquelo y dilo otra vez.",
        ko: "그 주소를 찾을 수 없었습니다. 한번 더 확인 해 보시고 다시 입력 해 주세요"
    },
    error_validate_apartment: {
        en: 'I couldn\'t verify that apartment number. Please try again.',
        es: "No pude verificar su número de apartamento. Por favor trate de nuevo.",
        ko: "그 아파트 호수를 확인 할 수 없었습니다. 다시 입력 해 주세요."
    },
    error_validate_gender: {
        en: 'Please enter your gender as male or female',
        es: "Por favor ingrese su género como masculino o femenino",
        ko: "성별을 입력 해 주세요"
    },
    error_validate_military_or_overseas: {
        en: "Sorry, I didn't get that. Please answer (military/overseas/no)",
        es: "Lo siento, no entendí eso. Por favor contesta (militar/extranjero/no)",
        ko: "유효한 입력이 아닙니다. 군인이면 militar, 해외 투표는 overseas, 둘 다 아니면 no 를 입력 해 주세요."
    },
    error_validate_ssn: {
        en: 'Please enter your social security number like 123-45-6789',
        es: "Por favor ingrese su número de seguro social como 123-45-6789",
        ko: "소셜 시큐리티 번호를 000-00-0000 형식으로 입력 해 주세요"
    },
    error_validate_ssn_last4: {
        en: 'Please enter just the last 4 digits of your social security number',
        es: "Por favor ingrese solo los ultimos 4 digitos de su número de seguro social.",
        ko: "소셜 시큐리티 번호의 마지막 4자리만을 입력 해 주세요."
    },
    error_validate_state_id_number: {
        en: 'Please enter a valid {{settings.state}} ID. If you don\'t have one, reply "NONE" and we will try something else.',
        es: "Por favor ingrese una identificación de {{settings.state}} válida. Si no tiene una, yo no puedo entregar su inscripción. Responde NINGUNO y yo le enviaré un formulario que puede imprimir y mandar por correo.",
        ko: "유효한 {{settings.state}} 주 정부 신분증 번호를 입력하세요. 주 신분증이 없으면 none 이라고 입력하세요."
    },
    error_state_deadline_expired: {
        en: 'Sorry, the online voter registration deadline for {{settings.state}} has passed.',
        es: "Lo siento, la fecha límite de inscripción para votar en {{settings.state}} ha pasado.",
        ko: "{{settings.state}} 주의 유권자 등록 마감일이 지났습니다."
    },
    error_validate_state_abbreviation: {
        en: 'Sorry, that\'s not a valid US state abbreviation.',
        es: "Lo siento, eso no es un abreviatura de estado válido.",
        ko: "유효한 미국 주 이름이 아닙니다 (2 글자)"
    },
    error_validate_state_name: {
        en: 'Sorry, that\'s not a valid US state name.',
        es: "Lo siento, eso no es un nombre de estado válido.",
        ko: "유효한 주 이름이 아닙니다"
    },
    msg_happy_birthday: {
        en: 'Happy birthday! \u{1F382}',
        es: "¡Feliz cumpleaños! \u{1F382}",
        ko: "생일 축하합니다! \u{1F382}"
    },
    prompt_email_for_ovr: {
        en: "I'm about to look up your registration status and send you crucial voting info. What's your email address?",
        es: "Estoy a punto de revisar el estado de su registro y también le enviare información de votación importante. ¿Cuál es su dirección de correo electrónico?",
        ko: "유권자 등록 정보를 보내드리겠습니다. 이메일 주소를 입력 해 주세요."
    },
    prompt_email_for_pdf: {
        en: "I'm about to look up your registration status and send you crucial voting info. What's your email address?",
        es: "Estoy a punto de revisar el estado de su registro y también de enviarle información de votación importante. ¿Cuál es su dirección de correo electrónico?",
        ko: "유권자 등록 정보를 보내드리겠습니다. 이메일 주소를 입력 해 주세요."
    },
    prompt_email_for_gotv: {
        en: "I'm about to send you crucial voting info. What's your email address?",
        es: "Estoy a punto de enviarle información de votación crucial. ¿Cuál es tu dirección de correo electrónico?",
        ko: "중요한 정보를 보내드리겠습니다. 이메일 주소를 입력 해 주세요."
    },
    msg_complete_ovr: {
        en: 'HelloVote just submitted your information to {{settings.state}}\'s online voter registration system, and I sent you an email receipt (be sure to read it!)',
        es: "HolaVote entregó su inscripción para votar en {{settings.state}}. Acabamos de enviarle un recibo por correo electrónico (¡asegúrese de leerlo!). ",
        ko: "HelloVote 시스템이 입력하신 정보를 {{settings.state}} 의 온라인 유권자 등록 시스템에 보냈습니다. 또 확인 이메일을 보내드렸습니다. (꼭 읽어보세요!)"
    },
    msg_complete_ovr_disclaimer: {
        en: 'Don\'t assume you\'re registered until you confirm with your state: hellovote.org/confirm/#{{settings.state}} - it may take days or weeks, but plz check! Your vote is important!',
        es: "No suponga que esta registrado hasta que lo confirme con su estado: hellovote.org/confirm/#{{settings.state}} - se puede tardar días o semanas, pero reviselo por favor. ¡Su voto es importante!",
        ko: "다음의 웹사이트에서 등록 여부를 확인 할 수 있습니다: hellovote.org/confirm/#{{settings.state}}\n주에 따라 며칠 또는 몇주 걸릴 수 있습니다. 하지만 꼭 확인하시고, 신청을 했다고 등록이 되었다고 단정하지 마세요!"
    },
    msg_complete_pdf: {
        en: "Great, now this is super important. We just emailed you a form. You **must** print, sign, and mail it, or you won't be registered! The deadline for {{settings.state}} is {{deadline}}.",
        es: "Bien, ahora esto es super importante. Acabamos de mandarle un correo electrónico con el formulario. **Debe imprimir, firmar y enviarlo por correo** o usted no sera registrado. La fecha límite para {{settings.state}} es {{deadline}}.",
        ko: "거의 다 끝났습니다! 지금 유권자 등록 양식을 이메일로 보내드렸습니다. 등록 마감일은 {{deadline}} 입니다. 받으시면 신속히 인쇄하고 서명해서 우편으로 보내세요."
    },
    msg_complete_pdf_fb: {
        en: "Here's your voter registration form (I also emailed you a copy!) You **must** print, sign, and mail it, or you won't be registered. The deadline for {{settings.state}} is {{deadline}}.",
        es: "Aqui esta su formulario de inscripcion (tambien le envie una copia por correo electrónico). **Debe imprimir, firmar y enviarlo por correo** o usted no sera registrado. La fecha límite para {{settings.state}} es {{deadline}}.",
        ko: "이것이 귀하의 유권자 등록 양식입니다. 등록 마감일은 {{deadline}} 입니다. 인쇄하고 서명해서 우편으로 보내야만 등록이 완성 됩니다."
    },
    msg_complete_mail: {
        en: "I'm mailing your form now! It should arrive by {{mail_eta}}. Once it does, you **must** sign & mail it, or you won't be registered! The deadline for {{settings.state}} is {{deadline}}",
        es: "¡Estoy enviando su formulario ahora! Debe llegar por {{mail_eta}}. Cuando lo reciba, **debe imprimir, firmar y enviarlo por correo** o usted no sera registrado. La fecha límite para {{settings.state}} es {{deadline}}.",
        ko: "귀하의 유권자 등록 양식을 우편으로 보내드리겠습니다. {{mail_eta}} 에 도착 할 겁니다. 받으시면 꼭 서명해서 마감일인 {{deadline}} 까지 보내세요!"
    },
    msg_ovr_failed: {
        en: 'Hmm, something went wrong when I tried to submit through the {{settings.state}} Online Voter Registration system, but no worries. We can do it the old-fashioned way.',
        es: "Hmm, algo salió mal cuando intente enviarlo a través del Sistema de Registro Electoral de {{settings.state}} en línea, pero no se preocupe. Podemos hacerlo de la manera antigua.",
        ko: "유권자 등록 정보를 전송하는 도중에 문제가 생겼습니다. 하지만 우편으로 하면 됩니다."
    },
    frag_soon: {
        en: 'soon',
        es: 'pronto',
        ko: "곧 도입되는 기능"
    },
    prompt_choose_nvra_delivery: {
        en: "OK - I can mail your voter registration form to you, but it'll take a few days & deadlines are approaching! Can you print it yourself instead? (yes/no)",
        es: "OK - puedo enviarle el formulario de registro por correo, pero va a tomar un par de días y las fechas límite se están acercando! ¿Lo puede imprimir usted mismo? (si/no)",
        ko: "유권자 등록 양식을 우편으로 보내드릴 수도 있지만, 마감일이 가깝기 때문에 시간이 충분하지 않을 수도 있습니다. 직접 인쇄하실 수 있으세요? (yes/no)"
    },
    error_incomplete: {
        en: 'Sorry, your registration is missing a required field.',
        es: "Lo siento, a su inscripción le falta una sección requerida.",
        ko: "제공하신 등록 정보에 의무 입력 내용이 빠져있습니다."
    },
    error_incomplete_you_are_missing: {
        en: 'You are missing:',
        es: "Le falta:",
        ko: "빠진 정보:"
    },
    msg_trying_again: {
        en: 'Sending your registration again.',
        es: "Estoy enviando su inscripción otra vez.",
        ko: "등록 정보를 다시 보내고 있습니다"
    },
    prompt_restart_after_complete: {
        en: 'We\'re all done. Would you like to start again? (yes/no/help)',
        es: "Ya terminamos. Quiere empezar de nuevo? (si/no/ayuda)",
        ko: "다 끝났습니다. 다시 시작하시겠어요? (Yes/no 또는 도움이 필요하면 help 를 입력하세요)"
    },
    msg_unsubscribed: {
        en: 'You are unsubscribed from Fight for the Future and Education Fund. No more messages will be sent. Email team@hello.vote to restart.',
        es: "Usted anuló su suscripción de Fight for the Future. No va a recibir más mensajes. Email team@hello.vote para reiniciar.",
        ko: "미래를 쟁취하자 재단의 이메일 소시지 구독을 해지하셨습니다. 더 이상 이메일을 받지 않으실 겁니다. 이메일을 다시 받기 위해서는 team@hello.vote 에 이메일을 보내주세요."
    },
    msg_unsubscribed_default: {
        en: 'You are unsubscribed from Fight for the Future. No more messages will be sent. Email team@hello.vote for help or to restart.',
        es: "Te desinscribes de Lucha por el futuro. No se enviarán más mensajes. Envíe un correo electrónico a team@hello.vote para obtener ayuda o para reiniciar.",
        ko: "미래를 쟁취하자 재단의 이메일 소시지 구독을 해지하셨습니다. 더 이상 이메일을 받지 않으실 겁니다. 도움을 요청하거나 이메일을 다시 받기 위해서는 team@hello.vote 에 이메일을 보내주세요."
    },
    msg_help: {
        en: 'To go back a step, say BACK. To unsubscribe, say STOP. To start over, re-enter your # on hellovote.org. All other questions, email team@hello.vote',
        es: "Para regresar, diga REGRESAR. Para anular su suscripción, diga STOP. Para volver a empezar, re-ingrese su # en holavote.org. Para otras preguntas envíe un mensaje a team@hello.vote",
        ko: "전 단계로 돌아가기 위해서는 back 을 입력하세요. 구독을 해지하기 위해서는 stop 을 입력하세요. 처음부터 시작하기 위해서는 hellovote.org 를 방문해서 전화번호를 입력하세요. 질문은 team@hello.vote 으로 보내주세요."
    },
    msg_help_default: {
        en: 'Fight for the Future. Help at team@hello.vote or 855-447-3383. Msg&data rates may apply. 4 msgs/month. To unsubscribe, text STOP',
        es: '“Fight for the Future.” Para ayuda - team@hello.vote o 855-447-3383. Datos pueden ser aplicados para desconectar mande mensaje diciendo “stop”',
        ko: "활동에 동참 해 주세요! 이메일 team@hello.vote 또는 855-447-3383 으로 연락 주세요.메세지 또는 데이터 요금이 적용 될 수 있습니다. 한달에 4 메세지. 구독 해지를 하기 원하서는 STOP 이라고 입력하세요."
    },
    msg_try_again: {
        en: 'Please try again!',
        es: "¡Por favor pruebe otra vez!",
        ko: "다시 시도 해 주세요."
    },
    msg_error_unknown: {
        en: 'I seem to have had a glitch. Please send your last message again.',
        es: "Ocurrió una falla. Por favor envíe su último mensaje otra vez.",
        ko: "무언가 문제가 생겼습니다. 마지막 메세지를 다시 보내주세요."
    },
    msg_error_failed: {
        en: 'Agh, an error occurred and your voter registration could not be processed. Please let us know: team@hellovote.org - reference #',
        es: "¡Ay! Un error occurio y su inscripción para votar no pudo ser procesada. Por favor avísenos: team@hellovote.org - # de referencia  ",
        ko: "유권자 등록 처리에 문제가 생겼습니다. 죄송합니다. 이메일 team@hellovote.org 로 다음의 레퍼런스 번호를 보내주세요: #"
    },
    msg_processing: {
        en: 'One moment please...',
        es: "Un momento por favor...",
        ko: "잠시만 기다려 주십시오…"
    },
    msg_address_appears_bogus: {
        en: '(FYI - I couldn\'t look up that address. Are you sure you didn\'t make a typo? If you need to correct it, say "BACK" to go back :)',
        es: "(No pude encontrar esa dirección. Está seguro que la información que ingresó es correcta?"
    },
    prompt_ovr_disclosure: {
        en: 'In order to continue, you must agree to the following statement',
        es: "Para continuar, debe estar de acuerdo con la declaración siguiente.",
        ko: "다음의 내용이 모두 맞으면 Yes 라고 대답 해 주십시오"
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
        es: "Bueno. Por favor diga su dirección anterior completa, **incluyendo** la ciudad, estado, y código postal. (Responda SALTAR si no cambio su dirección)",
        ko: "이전 주소를 입력 해주세요. 완전한 주소를 주세요 - 아파트 번호, 도시, 주, 우편번호를 다 포함해서 입력 해 주세요. (주소를 바꾼 적이 없으면 skip 을 입력하세요)"
    },
    prompt_previous_address_street: {
        en: 'Arg, I\'m sorry but I couldn\'t look up that address. Can you break it down for me? Please say just the number & street portion of that address (eg. 123 Main St.)',
        es: "¡Ay! Lo siento pero no puedo encontrar esa dirección. ¿La puede enviar en partes? Por favor solo ingrese su dirección de calle (por ejemplo: 123 Main St.)",
        ko: "그 주소를 찾을 수 없었습니다. 주소를 분리해서 입력해 주세요. 먼저 길 호수와 길 이름만 입력 해 주세요. (예: 123 Main St)"
    },
    prompt_previous_address_unit: {
        en: 'Alright, and what\'s the apartment number? (If you didn\'t have one, reply NONE)',
        es: "¿Cuál es su número de apartamento? (Si no tienes uno, responde: ninguno)",
        ko: "아파트 호수는 어떻게 되나요? (없으면 none 입력)"
    },
    prompt_previous_city: {
        en: 'What city were you previously registered to vote in?',
        es: "¿En cual ciudad estuvo previamente registrado para votar?",
        ko: "이전 주소의 도시는 어떻게 되나요?"
    },
    prompt_previous_state: {
        en: 'What state were you previously registered to vote in?',
        es: "¿En cual estado estuvo previamente registrado para votar?",
        ko: "이전 주소의 주는 어떻게 되나요?"
    },
    prompt_previous_zip: {
        en: 'What zip code were you previously registered to vote in?',
        es: "¿En cual codigo postal estuvo previamente registrado para votar?",
        ko: " 이전 주소의 우편번호는 어떻게 되나요?"
    },
    prompt_previous_county: {
        en: 'And finally, what county was your previous address in?',
        es: "Y por último, ¿en qué país tuvo su dirección anterior?",
        ko: "이전 주소의 도시는 어떻게 되나요?"
    },
    prompt_has_previous_name: {
        en: 'Alright then, have you been registered to vote in {{settings.state}} under a different name?',
        es: "Entonces bueno, ha sido registrado para votar en {{settings.state}} bajo un nombre diferente?",
        ko: "예전에 {{settings.state}} 주 에서 다른 이름으로 유권자 등록을 한 적이 있나요?"
    },
    prompt_previous_name: {
        en: 'What name were you previously registered under? (Reply SKIP if you didn\'t change your name)',
        es: "Bueno. Por favor diga el nombre completo bajo el cual estaba registrado previamente. (Responda SALTAR si no cambio su nombre)",
        ko: "어떤 이름으로 등록 되어 있었나요? (이름을 바꾸지 않았으면 skip 을 입력하세요)"
    },
    prompt_has_previous_name_address: {
        en: 'Were you previously registered to vote under a different name or address? (yes/no)',
        es: "¿Estuvo previamente registrado para votar con un nombre o una dirección diferente? (si/no)",
        ko: "전에 다른 이름 또는 다른 주소를 가지고 유권자 등록을 한 적이 있나요? (yes/no)"
    },
    prompt_has_separate_mailing_address: {
        en: 'Do you receive mail at a different address than your residential address?',
        es: "¿Usted recibe correo a una dirección diferente a la de su domicilio?",
        ko: "집 주소 말고 우편물을 받고자 하는 우편용 주소가 있으세요?"
    },
    prompt_separate_mailing_address: {
        en: 'OK. Please say your full mailing address including city, state and zip code.',
        es: "Bueno. Por favor diga su dirección completa, incluyendo la ciudad, estado, y código postal.",
        ko: "우편 주소를 입력 해 주세요. (도시, 주, 우편번호 포함)"
    },
    prompt_change_state: {
        en: 'Are you currently registered to vote in any other state? If so, say it here. If not, say "NO".',
        es: "¿Está actualmente registrado para votar en cualquier otro estado? Si es así, digalo aquí. Si no es así, diga NO",
        ko: "현재 다른 주에서 유권자 등록이 되어 계시나요? 그렇다면 주의 두 글자 이니셜 (예: CA) 를 입력하세요. 아니면 no 를 입력하세요."
    },
    button_register_to_vote: {
        en: 'Register to vote',
        es: "Inscríbirme para votar",
        ko: "유권자 등록"
    },
    button_get_to_the_polls: {
        en: 'Get to the polls!',
        es: "Llegue al lugar de votar!",
        ko: "투표하러 가세요!"
    },
    button_register_my_friends: {
        en: 'Register my friends',
        es: "Inscribir a mis amigos",
        ko: "친구들을 등록하기"
    },
    button_learn_more: {
        en: 'Learn more...',
        es: "Más información...",
        ko: "자세히..."
    },
    prompt_facebook_get_started_share: {
        en: 'OK! I can get your friends registered to vote right from Facebook Messenger. Tap the button below to share me with your friends!',
        es: "¡Ok! Puedo registrar a sus amigos para votar en Facebook Messenger. Haga click en el botón de abajo para compartirlo con sus amigos!",
        ko: "페이스북 메신저에 등록되어 있는 친구들의 연락처를 추출해서 유권자 등록 권유 메세지를 보낼 수 있습니다. 아래의 버튼을 눌러서 친구와 공유 하세요!"
    },
    button_share: {
        en: 'Share HelloVote!',
        es: "¡Compartir HolaVote!",
        ko: "HelloVote를 공유하세요!"
    },
    prompt_nudge: {
        en: 'Still there? Your voter registration isn\'t finished yet. Say "Yes" to continue, or "Stop" to unsubscribe.',
        es: "¿Sigue ahí? Su inscripción todavía no está completa. Diga \"SI\" para continuar o \"STOP\" para anular su suscripción.",
        ko: "유권자 등록이 아직 끝나지 않았습니다. 아직 이 메세지를 보고 계시나요? 등록을 계속하려면 Yes 를, 취소하려면 stop 을 입력하세요"
    },
    prompt_az_pevl: {
        en: "Would you like to be added to the Permanent Early Voter List? It's the easiest way to vote from home.",
        es: 'Te gustaria estar agregado en la “Permanent Early Voter List?” Esta es la manera mas facil para votar desde tu hogar. ',
        ko: "영구 조기 투표 유권자로써 등록을 하시겠어요? 이 방법이 집에서 등록을 할 수 있는 가장 쉬운 방법입니다."
    },
    prompt_choose_postage: {
        en: "Last question: I can include a stamp on your form, but it costs me 47 cents. Do you need a stamp? (yes/no)",
        es: 'La última pregunta: Puedo incluir una estampa en tu forma pero cuesta 47 centavos, necesitas una estampa?',
        ko: "저희가 등록 용지를 보내드릴 때 반송용 우표를 첨부 해 드릴 수 있지만 저희에게 47센트라는 비용이 듭니다. 우표가 필요하세요? (yes/no)"
    },
    error_deadline_expired_but_in_person_allowed: {
        en: 'Sorry, the voter registration deadline has passed. Fortunately {{settings.state}} allows in-person registration before Election Day.',
        es: 'Lo siento, el dia final para registrarse ya pasó. Afortunadamente {{settings.state}} te permite que te registres en persona el dia antes votar ',
        ko: "유권자 등록 마감일이 지났습니다. 다행히도 {{settings.state}} 주는 선거날 당일 등록을 지원합니다."
    },
    msg_refer_external_ovr: {
        en: 'To complete your voter registration online, please visit {url}',
        es: 'Para completar su forma de registración en el web por favor visite {url}',
        ko: "라인으로 유권자 등록을 마무리하고자 하면 {url} 을 방문하세요"
    },
    msg_warning_deadline_very_close: {
        en: 'WARNING - {{deadline}}. I can help you print and mail your form, but you should send it today!',
        es: 'Yo le puedo ayudar a imprimir y manda su forma por correo pero usted lo debería mandar hoy.',
        ko: "유권자 등록 양식을 인쇄할 수 있도록 도와드릴 수 있습니다. 마감일이 {{deadline}} 이기 때문에, 오늘 우편으로 보내세요!"
    },
    msg_you_must_mail: {
        en: 'OK - I\'m about to send you an email with your voter registration form. We\'re super close to the deadline, so you should print, sign and mail it today!',
        es: 'Le voy a mandar un correo electrónico con su forma de registración. Estamos muy cerca a la fecha final. Imprime, firme y mande su forma hoy. ',
        ko: "거의 다 끝났습니다! 유권자 등록 양식과 중요한 정보를 보내드리겠습니다. 등록 마감일이 곧 다가오고 있기 때문에 받으시면 신속히 인쇄하고 서명해서 우편으로 보내세요."
    },
    msg_ovr_failed_no_fallback: {
        en: 'I\'m so sorry. Something went wrong & I couldn\'t automatically send your registration through {{settings.state}}\'s online system. The deadline is soon, so please register online',
        es: 'Lo siento, algo ocurrió y no pude mandar su registración {{settings.state}}’s en la página web. El dia final se acerca, por favor regístrese via web  ',
        ko: "죄송합니다. 유권자 등록 정보를 전송하는 도중에 문제가 생겼습니다. 마감일이 임박 해 있기 때문에, {{settings.state}} 주 선거국의 웹사이트에서 유권자 등록을 하는 것이 좋습니다. (거기서 직접 등록하는 것과 이렇게 문자 메세지로 하는 것에 안정성의 차이가 있습니다)"
    },
    msg_intro_line_api: {
        en: 'HelloVote is managed by Fight for the Future and its Education Fund. Please see the link below for more  information regarding the handling of personal information LINE Corp provided to the Account Manager and any personal information you provide to the Account Manager.\nhttp://me2.do/IFN3hLvD',
        es: "“HelloVote” esta manejado por “Fight for the Future and its Education Fund. Por favor vea el enlace abajo para más información sobre cómo cuidar información personal.\nhttp://me2.do/IFN3hLvD",
        ko: "HelloVote 는 \”미래를 쟁취하자\” 재단이 관리합니다. 개인 정보 취급 방침은 다음의 웹사이트에서 읽어보실 수 있습니다:\nhttp://me2.do/IFN3hLvD"
    },
    prompt_early_voting: {
        en: 'Early voting has started in your state! When are you going to vote?',
        es: 'En su estado ya empezaron a votar! Usted cuando va a botar?',
        ko: "기 투표가 시작되었습니다! 언제 투표하실 계획이십니까?"
    },
    msg_lookup_polling_location: {
        en: 'OK. Let\'s get your address so I can look up your polling location.',
        es: 'Ok. Deme su dirección para poder buscar su lugar de votar',
        ko: "주소를 주시면 투표소 위치를 알려드릴 수 있습니다"
    },
    msg_ev_polling_url: {
        en: 'Great! Get directions to your polling place here: {url}',
        es: 'Que bueno! Reciba direcciones hacia el lugar donde votar aquí: {url}',
        ko: "투표소를 가는 길은 여기서 확인 가능합니다: {url}"
    },
    prompt_mail_in: {
        en: '{{settings.state}} is a vote-by-mail state. Have you mailed in your ballot yet? (yes/no)',
        es: '{{settings.state}} es un estado que votar por correo. Usted a enviado su boleto?',
        ko: "{{settings.state}} 주에서는 우편 투표만 가능합니다. 우편 투표 용지를 보내셨나요? (yes/no)"
    },
    msg_mail_your_ballot: {
        en: 'Please mail your ballot soon - the deadline is coming up! Once you\'ve voted, you can say "I VOTED" and something amazing will happen!',
        es: 'Por favor envíe su  boleta por correo -- el ultimo dia se acerca! Cuando usted haya votado, puede decir, “YO VOTÉ” y algo increíble pasara!',
        ko: "투표 용지를 곧 보내셔야 합니다. 마감일이 가깝습니다. 투표한 후 “i voted” 라고 입력하시면 놀라운 일이 일어납니다!"
    },
    msg_share_gotv: {
        en: "Get your friends to the polls -- please share HelloVote!\n* Share on Facebook: {share_url}\n* Share on Twitter: {tweet_url}",
        es: 'Anime a sus amigos a que vayan a votar -- por favor compartan “HelloVote!\n*” Comparte en Facebook {share_url}\n* Comparte en Twitter  {tweet_url}',
        ko: "구들에게 알려주세요!\n*페이스북 공유: {share_url}\n*트위터 공유: {tweet_url}"
    },
    msg_share_sms_gotv: {
        en: "Forward this message to everyone you care about! Register to vote and get to the polls: Visit https://hello.vote",
        es: 'Pase este mensaje a todos los que conozca usted! Regístrate para votar y vaya a votar',
        ko: "리 알려주세요! 유권자 등록을 하고 투표소 정보를 얻으세요: https://hello.vote"
    },
    msg_i_voted_selfie: {
        en: "Awesome! Get your 'I VOTED' selfie badge to show your friends & get them to the polls! Visit https://i-voted.hello.vote to get yours.",
        es: 'Estupendo! Reciba su “I VOTED” para enseñarle a sus amigos. Visita la pagina web https://i-voted.hello.vote para obtener el suyo ',
        ko: "사합니다! 웹사이트 https://i-voted.hello.vote 에서 I Voted 셀피 뱃지를 받으시고 친구들에게도 투표를 권유하세요! "
    },
    prompt_commit_to_vote_from_notification: {
        en: "Hey {{first_name}}, it's HelloVote. Election Day is coming up! Would you like to receive a calendar invite with your polling location?",
        es: 'Hola, {{first_name}} soy “HelloVote” Día de Elección se acerca! Te gustaria recibir una invitación de calendario con la ubicación del lugar a donde votar?',
        ko: "{first_name}}님, HelloVote입니다. 선거날이 다가오고 있습니다! 투표소 위치가 표시된 온라인 달력 리마인더를 보내드릴까요?"
    },
    prompt_commit_to_vote: {
        en: "{{first_name}}, lets get you ready to vote on Tuesday, election day. Would you like to receive a calendar invite with your polling location?",
        es: '{{first_name}], vamos a prepararte para votar el dia martes, dia de votar. Te gustaría recibir una invitación de calendario con la ubicación del lugar a donde votar?',
        ko: "{{first_name}}님, 화요일 선거날에 투표 할 준비를 합시다. 투표소 위치가 표시된 온라인 달력 리마인더를 보내드릴까요?"
    },
    prompt_zip_gotv: {
        en:  "Now, what's your zip code? To get your Election Day info, we need to know where you're registered to vote.",
        es: 'Ahora, que es tu código postal? Para obtener tu información de dia de elecciones, necesitamos saber donde se registró para votar.  ',
        ko: "편번호(ZIP Code)가 어떻게 되세요? 선거날 정보를 드리기 위해서는 어디에 등록되어 있는지에 대한 정보가 필요합니다."
    },
    msg_calendar_invite: {
        en: "Okay, I've just sent you a calendar invite by email. I'll send you all the info you need in the coming days."
    },
    msg_voter_selfie: {
        en: 'Get your VOTER selfie! Share with your friends and help get them to the polls: https://selfie.hello.vote'
    },
    msg_election_day_tomorrow: {
        en: 'Election Day is tomorrow!',
        es: 'Dia para votar es mañana! ',
        ko: "내일이 선거 날입니다!"
    },
    msg_election_day_today: {
        en: 'Today is Election Day!',
        es: 'Hoy es dia de votar!',
        ko: "오늘이 선거 날입니다!"
    },
    msg_polling_place: {
        en: 'Your polling place is at {{location}} in {{location_city}}. {{results.polling_place.link}}',
        es: 'Su lugar de votar esta {{location}} {{location_cityell}} {{results.polling_place.link}}',
        ko: "투표소 주소는 {{location}} 입니다 (도시: {{location_city}}). 지도 상에서 보기:  {{results.polling_place.link}}"
    },
    msg_lookup_polling_place: {
        en: 'You can look up your polling place at http://gettothepolls.com',
        es: 'Usted puede ir al enlace http://gettothepolls.com para obtener mas informacion',
        ko: "웹사이트 http://gettothepolls.com 에서 투표소를 찾아보실 수 있습니다"
    },
    msg_polling_place_directions: {
        en: 'In case you need it, here\'s a map to your polling place {{results.polling_place.link}}',
        es: 'En caso que lo necesite, aqui esta una mapa guandolo a usted hacia el lugar de votar {{results.polling_place.link}}',
        ko: "투표소를 지도에서 보려면 {{results.polling_place.link}} 를 방문하세요"
    },
    prompt_schedule_vote_time: {
        en: 'What time will you vote?',
    },
    error_schedule_time: {
        en: 'Please enter a time, like "5pm"',
    },
    msg_gotv_1_reintro: {
        en: "Hey {{first_name}}, it's HelloVote.",
        es: 'Hola {{first_name}}, soy“HelloVote”',
        ko: "{{first_name}}님, 안녕하세요? HelloVote 입니다."
    },
    msg_gotv_1_reintro_from_notification: {
        en: "Hey {{first_name}}, it\'s HelloVote. Tomorrow is election day! Are you ready to vote?",
        es: 'Hola {{first_name}} soy“HelloVote. Manana es dia de eleccion! Esta usted listo para votar ',
        ko: "{{first_name}}님, HelloVote 입니다. 선거날이 내일로 다가왔습니다! 투표 할 준비는 되셨나요?"
    },
    error_validate_time_early: {
        en: 'Are you sure you meant {{time}}?. Please format like HH:MM AM/PM',
    },
    error_validate_time: {
        en: 'I didn\'t understand that time. Please format like HH:MM AM/PM',
    },
    msg_election_day_hotline: {
        en: 'It\'s HelloVote again. Today is Election Day! If you or anyone you know is having trouble voting, call this legal hotline 1-866-OUR-VOTE',
        es: 'Hoy es el Día de la Elección y HelloVote puede asegurarse de que llegue a las urnas! Si usted o alguien que usted conoce tiene problemas para votar, llame a esta línea directa legal 1-888-VE-Y-VOTA',
        ko: "오늘이 선거 날입니다! 투표하는데 어려움을 겪고 계시면 1-866-OUR-VOTE 으로 전화주세요 (법적 문의 핫라인)"
    },
    prompt_for_voted: {
        en: 'Once you\'ve voted, reply "I voted" and I\'ll get you a voter selfie!'
    },
    msg_help_line: {
        en: 'If you or anyone you know is having trouble voting, call this legal hotline 1-866-OUR-VOTE',
        es: 'Si usted o alguna persona que usted conoce está teniendo dificultades votando, llame a la línea de servicio legal. 1-866-OUR-VOTE',
        ko: "표하는데 어려움을 겪고 계시면 1-866-OUR-VOTE 으로 전화주세요 (법적 문의 핫라인)"
    },
    msg_did_you_vote: {
        en: 'HelloVote again. Did you vote? (yes/no)',
        es: '“HelloVote” otra vez. Has votado? (si/no) ',
        ko: "안녕하세요, HelloVote 입니다. 투표하셨나요? (yes/no)"
    },
    prompt_election_day_reporting: {
        en: 'HelloVote is partnering with journalists across the US to tell Election Day voting stories. Would you like to share yours? (yes/no)',
    },
    prompt_reporting_wait_time: {
        en: 'How long did you wait to vote in minutes?',
    },
    prompt_reporting_problems: {
        en: 'Did you have any problems voting? (yes/no)',
    },
    prompt_reporting_story: {
        en: 'What did you see or experience?',
    },
    prompt_reporting_contact_ok: {
        en: 'Are you OK with a journalist contacting you about your story? (yes/no)',
    },
    prompt_reporting_polling_place: {
        en: 'Where did you vote? Please include the address, city and state.',
        ko: "디에서 투표하셨나요? 주소, 도시, 주를 포함 해 주세요."
    },
    msg_reporting_followup: {
        en: 'A journalist may follow up with you for more information on your story.',
        ko: "러분의 이야기에 대해 기자가 취재를 요청 할 수도 있습니다"
    },
    msg_thanks_for_using: {
        en: 'Thanks for using HelloVote!',
        ko: "HelloVote를 사용 해 주셔서 감사합니다"
    },
    msg_disabled: {
        en: 'Thanks for using HelloVote! This bot is now disabled!',
        ko: "HelloVote를 사용 해 주셔서 감사합니다. 서비스가 종료되었습니다."
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
