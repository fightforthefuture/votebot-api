var pg = require('pg');
var moment = require('moment');
pg.defaults.ssl = true;

var query = [
    'SELECT     users.*',
    'FROM       conversations, conversations_recipients, users',
    'WHERE      conversations.partner = {{partner}}',
    'AND        conversations_recipients.conversation_id = conversations.id',
    'AND        users.id = conversations_recipients.user_id',
    'AND        users.active = TRUE',
    'ORDER BY   users.created DESC'
];

var partner = process.argv[2];
var connstr = process.argv[3];
var include_dob = (process.argv[4] === 'include_dob');

query = query.join('\n').replace('{{partner}}', '\''+partner+'\'');

var escape = function(str) {
    try {
        return str ? str.replace(/\"/g, '\\"') : ""
    } catch(err) {
        return str
    }
}

pg.connect(connstr, function(err, client, done) {
    if(err) {
        console.error(err);
        console.log('Error connecting to database!');
        process.exit(1);
    };
    client.query(query, {}, function(err, result) {
        var age_or_dob = include_dob ? "date_of_birth" : "age";
        console.log('"timestamp","first_name","last_name","email","phone","address","address_unit","city","state","zip",'+age_or_dob+',"already_registered","form_submitted","partner"');
        for (var i=0; i<result.rows.length; i++) {
            var row = result.rows[i];
            var line = '';
            line += '"'+escape(moment(row.created), moment.ISO_8601).format('L LT')+'",';
            line += '"'+escape(row.first_name)+'",';
            line += '"'+escape(row.last_name)+'",';
            line += '"'+escape(row.settings.email)+'",';
            line += '"'+escape(row.username)+'",';
            line += '"'+escape(row.settings.address)+'",';
            line += '"'+escape(row.settings.address_unit)+'",';
            line += '"'+escape(row.settings.city)+'",';
            line += '"'+escape(row.settings.state)+'",';
            line += '"'+escape(row.settings.zip)+'",';
            if (include_dob) {
                line += '"'+escape(row.settings.date_of_birth)+'",';
            } else {
                line += '"'+escape(moment().diff(moment(row.settings.date_of_birth,'YYYY-MM-DD'), 'years'))+'",';
            }
            line += '"'+escape(row.settings.already_registered)+'",';
            line += '"'+escape(row.submit)+'",';
            line += '"'+escape(partner)+'"';

            console.log(line);
        }
        process.exit(0);
    });
});