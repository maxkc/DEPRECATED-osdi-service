var should = require('should'),
    supertest = require('supertest'),
    proxyquire = require('proxyquire'),
    sinon = require('sinon'),
    config = require('../config.js');

var root = config.get('apiEndpoint');
var tagsEndpoint = 'api/v1/tags';

describe('/api/v1/tags', function() {
  var app;
  var forceSuccess, forceBadRequest, forceUnauthorized
  var ac;
  beforeEach(function() {
    var cb = function(vanEndpoint, apiKey, dbMode, id,
      unauthorized, badRequest, success) {

      if (forceSuccess) {
        success(ac);
      } else if (forceUnauthorized) {
        unauthorized();
      } else {
        badRequest();
      }
    };
    var clientMock = {'@global': true, getActivistCode: cb};
    var requestMock = function(){};
    requestMock['@global'] = true;
    var mocks = {'../lib/ngpvanapi-client': clientMock, 'request': requestMock};
    ac = {activistCodeId: 1}
    app = proxyquire('../app.js', mocks);
  });
  describe('GET tags/tagId', function() {
    it('returns a translated tag from VAN for valid tag ID', function(done) {
      forceSuccess = true;
      supertest(app)
        .get('/' + tagsEndpoint + '/1')
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(200, function(err, res) {
          var body = JSON.parse(res.text);
          var selfLink = root + 'tags/1';
          body.origin_system.should.equal('VAN');
          body.identifiers[0].should.equal('VAN:1');
          body._links.self.href.should.equal(selfLink)
//          console.log(body)
          done()
        });
    });

  });
});
