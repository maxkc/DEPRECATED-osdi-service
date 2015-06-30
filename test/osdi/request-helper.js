/*global describe, it */

var osdi = require('../../lib/osdi').request;
var should = require('should');

describe.only('osdi.request-helper', function() {
  describe('#getCredentials', function() {
    it('parses apiKey and dbMode', function() {
      var req = {
        headers: {authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmR8MA=='}
      };
      var creds = osdi.getCredentials(req);

      creds.apiKey.should.equal('password');
      creds.dbMode.should.equal('0');
    });
  });
});
