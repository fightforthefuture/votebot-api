var user_model = require('../models/user');

var assert = require('chai').assert;
describe('User', function() {
  describe('#parse_username()', function() {
    it('should return undefined for invalid US numbers', function() {
      assert.equal(undefined, user_model.parse_username('123'));
    });
    it('should return a number with country code when passed without', function() {
      validate_parsed_user('9145550001', '+19145550001', 'sms');
    });
    it('should return a number with a plus sign when passed without', function() {
      validate_parsed_user('19145550001', '+19145550001', 'sms');
    });
    it('should return an IE number with a plus sign when passed country', function() {
      validate_parsed_user('0875550001', '+353875550001', 'sms', {country: 'IE'});
    });
    it('should return a messenger id untouched', function() {
      validate_parsed_user('messenger:999', 'messenger:999', 'facebook-messenger');
    });
  });
});

function validate_parsed_user(raw_username, username, type, options) {
  var parsed_username = user_model.parse_username(raw_username, options);
  assert.equal(username, parsed_username.username);
  assert.equal(type, parsed_username.type);
}