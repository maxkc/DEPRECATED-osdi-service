/*global describe, it */
/*exported should */
/*jshint -W030 */

var should = require('should'),
    supertest = require('supertest'),
    app = require('../app');

describe('AEP', function() {

  it('should return basic details about service', function(done) {
    supertest(app).
      get('/api/v1/').
      set('Accept', 'application/hal+json').
      expect(200, function(err, res) {
        var body =  JSON.parse(res.text);
        should.equal(res.headers['content-type'],
          'application/hal+json; charset=utf-8');
        should.equal(body.motd, 'Welcome to the NGP VAN OSDI Service!');
        should.equal(body.max_pagesize, 200);
        should.equal(body.vendor_name, 'NGP VAN, Inc.');
        should.equal(body.product_name, 'VAN');
        should.equal(body.osdi_version, '1.0');
        should.equal(body._links.self.href,
          'https://ngpvan-osdi-service.herokuapp.com/api/v1/');
        should.equal(body._links.self.title,
          'NGP VAN OSDI Service Entry Point');

        var tags = body._links['osdi:tags'];
        should.equal(tags.href, 'https://ngpvan-osdi-service.herokuapp.com/api/v1/tags');
        should.equal(tags.title, 'The collection of tags in the system');
        done();
      });
  });

});
