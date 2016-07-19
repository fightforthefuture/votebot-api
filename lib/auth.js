var basicAuth = require('basic-auth');
var config = require('../config');

exports.basic = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
  };

  var user = basicAuth(req);
  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };

  if (user.name === 'admin' && user.pass === config.app.admin_password) {
    return next();
  } else {
    return unauthorized(res);
  };
};