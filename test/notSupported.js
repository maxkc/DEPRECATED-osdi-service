/*global describe, it */
/*exported should */
/*jshint -W030 */

var should = require('should'),
    supertest = require('supertest'),
    app = require('../app');

describe('notSupported', function() {

  it('should not support anything', function(done) {
    supertest(app).
      get('/api/v1/').
      expect(500, function(err, res) {
        should.equal(res.body.request_type, 'atomic');
        should.equal(res.body.response_code, 500);
        res.body.resource_status.should.be.length(1);
        should.equal(res.body.resource_status[0].resource, '*');
        should.equal(res.body.resource_status[0].response_code, '500');
        res.body.resource_status[0].errors.should.be.length(1);
        should.equal(
          res.body.resource_status[0].errors[0].code,
          'NOT_SUPPORTED');
        done();
      });
  });

});
