var user_model = require('../models/user');

var assert = require('chai').assert;
describe('User', function() {
  describe('#parse_username()', function() {
    it('should return undefined for invalid US numbers', function() {
      assert.equal(undefined, user_model.parse_username('123'));
    });
    it('should return a number with country code when passed without', function() {
      assert.equal('+19145550001', user_model.parse_username('9145550001'));
    });
    it('should return a number with a plus sign when passed without', function() {
      assert.equal('+19145550001', user_model.parse_username('19145550001'));
    });
    it('should return an IE number with a plus sign when passed country', function() {
      assert.equal('+353875550001', user_model.parse_username('0875550001', {country: 'IE'}));
    });
    it('should return a messenger id untouched', function() {
      assert.equal('messenger:999', user_model.parse_username('messenger:999'));
    });
  });
});
