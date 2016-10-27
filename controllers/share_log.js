var resutil = require('../lib/resutil');
var convo_model = require('../models/conversation');
var log = require('../lib/logger');
var error = require('../lib/error');
var config = require('../config');
var l10n = require('../lib/l10n');
var model = require('../models/share_log');

exports.hook = function(app)
{
	app.get('/share/:id/:url', logAndRedirect);
};

var logAndRedirect = function(req, res)
{
	var user_id = config.bot.user_id;
	var data = req.body;

	log.info('share: req.params: ', req.params);

    var url = new Buffer(req.params.url, 'base64').toString('ascii');

    model.log({
        user_id: req.params.id,
        url: url
    })
    resutil.redirect(res, url);
};
