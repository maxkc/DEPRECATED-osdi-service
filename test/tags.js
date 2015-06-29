/*global describe, it, beforeEach */

require('should');
var supertest = require('supertest'),
    proxyquire = require('proxyquire'),
    sinon = require('sinon'),
    config = require('../config.js'),
    testService = require('./testService.js');

var root = config.get('apiEndpoint');

function validateTag(ac, tag) {
  var selfLink = root + 'tags/' + ac.activistCodeId;
  tag.origin_system.should.equal('VAN');
  tag.identifiers[0].should.equal('VAN:' + ac.activistCodeId);
  tag.name.should.equal(ac.name);
  tag.description.should.equal(ac.description);
  tag._links.self.href.should.equal(selfLink);
}

describe('/api/v1/tags', function() {
  var tagsEndpoint = 'api/v1/tags';
  var app;
  var clientMock;
  var getTagResponseHandler, getTagsResponseHandler;
  var ac, acs;
  beforeEach(function() {
    getTagResponseHandler = new testService.VanResponseHandlerMock();
    getTagsResponseHandler = new testService.VanResponseHandlerMock();

    ac = testService.createActivistCodes(1)[0];
    acs = testService.createActivistCodes(100);

    getTagResponseHandler.successData = ac;
    getTagsResponseHandler.successData = {items: acs};

    clientMock = {
      '@global': true,
      getActivistCode:
       getTagResponseHandler.handle.bind(getTagResponseHandler),
      getActivistCodes:
       getTagsResponseHandler.handle.bind(getTagsResponseHandler),
    };

    sinon.spy(clientMock, 'getActivistCode');
    sinon.spy(clientMock, 'getActivistCodes');

    var mocks = {'../lib/ngpvanapi-client': clientMock};
    app = proxyquire('../app.js', mocks);
  });

  describe('GET tags/tagId', function() {
    it('returns a translated tag from VAN for valid tag ID', function(done) {
      getTagResponseHandler.forceSuccess = true;
      supertest(app)
        .get('/' + tagsEndpoint + '/' + ac.activistCodeId)
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(200, function(err, res) {
          var body = JSON.parse(res.text);
          validateTag(ac, body);
          done();
        });
    });

    it('returns 500 when a VAN error occurs', function(done) {
      getTagResponseHandler.forceBadRequest = true;
      supertest(app)
        .get('/' + tagsEndpoint + '/' + ac.activistCodeId)
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(500, function(err, res) {
          var body = JSON.parse(res.text);

          body.response_code.should.equal(500);
          body.resource_status[0].errors[0].code.should.equal('UNKNOWN');

          done();
        });
    });

    it('returns 404 when AC not found in VAN', function(done) {
      getTagResponseHandler.forceNotFound = true;
      supertest(app)
        .get('/' + tagsEndpoint + '/' + ac.activistCodeId)
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(404, done);
    });

  });

  describe('GET tags', function() {
    it('returns translated tags from VAN', function(done) {
      getTagsResponseHandler.forceSuccess = true;
      supertest(app)
        .get('/' + tagsEndpoint)
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(200, function(err, res) {
          var body = JSON.parse(res.text);
          for (var i = 0; i < body._embedded.length; i++) {
            var ac = acs[i];
            var tag = body._embedded[i];
            validateTag(ac, tag);
          }
          done();
        });
    });

    it('requests paginated tags from VAN', function(done) {
      getTagsResponseHandler.forceSuccess = true;
      var pagination = {
        page: 3,
        perPage: 5
      };
      supertest(app)
        .get('/' + tagsEndpoint + '?page=3&per_page=5')
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(200, function() {
          clientMock.getActivistCodes.calledWith(
            sinon.match.any,
            sinon.match(pagination)
          ).should.equal(true);
          done();
        });
    });

    it('returns 500 when a VAN error occurs', function(done) {
      getTagsResponseHandler.forceBadRequest = true;
      supertest(app)
        .get('/' + tagsEndpoint)
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(500, function(err, res) {
          var body = JSON.parse(res.text);

          body.response_code.should.equal(500);
          body.resource_status[0].errors[0].code.should.equal('UNKNOWN');

          done();
        });
    });

    it('returns 404 when ACs not found in VAN', function(done) {
      getTagsResponseHandler.forceNotFound = true;
      supertest(app)
        .get('/' + tagsEndpoint)
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(404, done);
    });
  });
});
