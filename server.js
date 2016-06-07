process.setMaxListeners(100);

var config = require('./config');
var express = require('express');
var body_parser = require('body-parser');
var cookie_parser = require('cookie-parser');
var method_override = require('method-override');
var app = express();
var router = express.Router();
var fs = require('fs');
var morgan = require('morgan');
var resutil = require('./lib/resutil');
var log = require('./lib/logger');

app.disable('etag');
app.use(cookie_parser());
app.use(body_parser.json({strict: false, limit: '4mb'}));
app.use(body_parser.urlencoded({extended: false, limit: '4mb'}));

app.use(morgan(':remote-addr ":method :url" :status :res[content-length]'));
app.use(method_override('_method'));
app.use(function(err, req, res, next) {
	console.error('Express error: ', err.stack);
	resutil.error(res, 'App error', err.stack);
});
app.use('/', router);
app.all('*', function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'X-API-Key,Authorization,Content-Type,Accept,Origin,User-Agent,DNT,Cache-Control,X-Mx-ReqToken,Keep-Alive,X-Requested-With,If-Modified-Since');
	next();
});

// load controllers
var controller_dir = './controllers';
fs.readdirSync(controller_dir).forEach(function(file) {
	if(file.match(/^\./) || !file.match(/\.js$/)) return;
	log.notice('loading controller:', file);
	var controller = require(controller_dir+'/'+file);
	if(!controller.hook) throw new Error('Controller: '+file+': missing `route()` function');
	controller.hook(app);
});

// our default API route
app.get('/', function(req, res) {
	resutil.send(res, {message: 'Good day, fellow explorer.'});
});

var port = config.port ? config.port : 3000
app.listen(port);
log.info('API: listening on '+port);


