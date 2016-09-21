var pg = require('pg');
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

query = query.join('\n').replace('{{partner}}', '\''+partner+'\'');

var escape = function(str) {
    return str ? str.replace(/\"/g, '\\"') : ""
}

pg.connect(connstr, function(err, client, done) {
    if(err) {
        console.log('Error connecting to database!');
        process.exit(1);
    };
    client.query(query, {}, function(err, result) {
        console.log('"first_name","last_name","email","phone","address","address_unit","city","state","zip","complete","partner"');
        for (var i=0; i<result.rows.length; i++) {
            var row = result.rows[i];
            var line = '';

            line += '"'+escape(row.first_name)+'",';
            line += '"'+escape(row.last_name)+'",';
            line += '"'+escape(row.settings.email)+'",';
            line += '"'+escape(row.username)+'",';
            line += '"'+escape(row.settings.address)+'",';
            line += '"'+escape(row.settings.address_unit)+'",';
            line += '"'+escape(row.settings.city)+'",';
            line += '"'+escape(row.settings.state)+'",';
            line += '"'+escape(row.settings.zip)+'",';
            line += '"'+(row.complete ? 'complete' : '')+'",';
            line += '"'+escape(partner)+'"';

            console.log(line);
        }
        process.exit(0);
    });
});