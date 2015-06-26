var should = require('should'),
    supertest = require('supertest'),
    proxyquire = require('proxyquire'),
    sinon = require('sinon'),
    config = require('../config.js'),
    testService = require('./testService.js');

var root = config.get('apiEndpoint');
var tagsEndpoint = 'api/v1/tags';

describe('/api/v1/tags', function() {
  var app;
  var getTagResponseHandler, getTagsResponseHandler;
  var ac;
  beforeEach(function() {
    getTagResponseHandler = new testService.VanResponseHandlerMock();
    getTagsResponseHandler = new testService.VanResponseHandlerMock();

    ac = {activistCodeId: 1, name: 'Test AC', description: 'A Test Activist Code'}
    getTagResponseHandler.successData = ac;
    var clientMock = {
      '@global': true,
      getActivistCode: getTagResponseHandler.handle.bind(getTagResponseHandler)
    };

    var requestMock = function(){};
    requestMock['@global'] = true;
    var mocks = {'../lib/ngpvanapi-client': clientMock, 'request': requestMock};
    app = proxyquire('../app.js', mocks);
  });

  describe('GET tags/tagId', function() {
    it('returns a translated tag from VAN for valid tag ID', function(done) {
      getTagResponseHandler.forceSuccess = true;
      supertest(app)
        .get('/' + tagsEndpoint + '/1')
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(200, function(err, res) {
          var body = JSON.parse(res.text);
          var selfLink = root + 'tags/1';
          body.origin_system.should.equal('VAN');
          body.identifiers[0].should.equal('VAN:1');
          body.name.should.equal(ac.name);
          body.description.should.equal(ac.description);
          body._links.self.href.should.equal(selfLink)
          done()
        });
    });

    it('returns 500 when a VAN error occurs', function(done) {
      getTagResponseHandler.forceBadRequest = true;
      supertest(app)
        .get('/' + tagsEndpoint + '/1')
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
        .get('/' + tagsEndpoint + '/1')
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(404, done);
    });

  });
});
