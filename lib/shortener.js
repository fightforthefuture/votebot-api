var rp = require('request-promise');

module.exports = function(url) {
    url = 'https://go.hello.vote/api/create/?url=' + url;
    return rp(url);
};