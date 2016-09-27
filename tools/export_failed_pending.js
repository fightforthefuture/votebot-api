var pg = require('pg');
pg.defaults.ssl = true;

var query = [
    'SELECT     users.*',
    'FROM       users, submissions',
    'WHERE      submissions.user_id = users.id',
    'AND        submissions.id <= 13691',
    'AND        submissions.id >= 12656',
    'AND        submissions.status = \'pending\'',
    'AND        users.complete = false',
    'GROUP BY   users.id',
    'ORDER BY   users.created DESC'
];

var connstr = process.argv[2];

query = query.join('\n');

var escape = function(str) {
    return str ? str.replace(/\"/g, '\\"') : ""
}

pg.connect(connstr, function(err, client, done) {
    if(err) {
        console.log('Error connecting to database!');
        process.exit(1);
    };
    client.query(query, {}, function(err, result) {
        console.log('"first_name","last_name","email","phone","address","address_unit","city","state","zip","complete","submit_form_type","partner"');
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
            line += '"'+escape(row.settings.submit_form_type)+'",';
            line += '"fftf"';

            console.log(line);
        }
        process.exit(0);
    });
});