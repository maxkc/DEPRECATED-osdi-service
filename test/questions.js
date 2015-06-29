/*global describe, it, beforeEach */

require('should');
var supertest = require('supertest'),
    proxyquire = require('proxyquire'),
    sinon = require('sinon'),
    config = require('../config.js'),
    testService = require('./testService.js');

var root = config.get('apiEndpoint');

function validateQuestion(sq, question) {
  var selfLink = root + 'questions/' + sq.surveyQuestionId;
  question.origin_system.should.equal('VAN');
  question.identifiers[0].should.equal('VAN:' + sq.surveyQuestionId);
  question.name.should.equal(sq.mediumName);
  question.description.should.equal(sq.scriptQuestion);
  question.title.should.equal(sq.name);
  question.summary.should.equal(sq.scriptQuestion);
  question.question_type.should.equal('SingleChoice');

  question._links.self.href.should.equal(selfLink);
}

describe('/api/v1/questions', function() {
  var questionsEndpoint = 'api/v1/questions';
  var app;
  var clientMock;
  var getQuestionResponseHandler, getQuestionsResponseHandler;
  var sq, sqs;
  beforeEach(function() {
    getQuestionResponseHandler = new testService.VanResponseHandlerMock();
    getQuestionsResponseHandler = new testService.VanResponseHandlerMock();

    sq = testService.createSurveyQuestions(1)[0];
    sqs = testService.createSurveyQuestions(100);

    getQuestionResponseHandler.successData = sq;
    getQuestionsResponseHandler.successData = {items: sqs};

    clientMock = {
      '@global': true,
      getSurveyQuestion:
       getQuestionResponseHandler.handle.bind(getQuestionResponseHandler),
      getSurveyQuestions:
       getQuestionsResponseHandler.handle.bind(getQuestionsResponseHandler),
    };

    sinon.spy(clientMock, 'getSurveyQuestion');
    sinon.spy(clientMock, 'getSurveyQuestions');

    var mocks = {'../lib/ngpvanapi-client': clientMock};
    app = proxyquire('../app.js', mocks);
  });

  describe('GET questions/questionId', function() {
    it('returns a translated question from VAN for valid question ID', function(done) {
      getQuestionResponseHandler.forceSuccess = true;
      supertest(app)
        .get('/' + questionsEndpoint + '/' + sq.surveyQuestionId)
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(200, function(err, res) {
          var body = JSON.parse(res.text);
          validateQuestion(sq, body);
          done();
        });
    });

    it('returns 500 when a VAN error occurs', function(done) {
      getQuestionResponseHandler.forceBadRequest = true;
      supertest(app)
        .get('/' + questionsEndpoint + '/' + sq.surveyQuestionId)
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(500, function(err, res) {
          var body = JSON.parse(res.text);

          body.response_code.should.equal(500);
          body.resource_status[0].errors[0].code.should.equal('UNKNOWN');

          done();
        });
    });

    it('returns 404 when SQ not found in VAN', function(done) {
      getQuestionResponseHandler.forceNotFound = true;
      supertest(app)
        .get('/' + questionsEndpoint + '/' + sq.surveyQuestionId)
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(404, done);
    });

  });

  describe('GET questions', function() {
    it('returns translated questions from VAN', function(done) {
      getQuestionsResponseHandler.forceSuccess = true;
      supertest(app)
        .get('/' + questionsEndpoint)
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(200, function(err, res) {
          var body = JSON.parse(res.text);
          for (var i = 0; i < body._embedded.length; i++) {
            var sq = sqs[i];
            var question = body._embedded[i];
            validateQuestion(sq, question);
          }
          done();
        });
    });

    it('requests paginated questions from VAN', function(done) {
      getQuestionsResponseHandler.forceSuccess = true;
      var pagination = {
        page: 3,
        perPage: 5
      };
      supertest(app)
        .get('/' + questionsEndpoint + '?page=3&per_page=5')
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(200, function() {
          clientMock.getSurveyQuestions.calledWith(
            sinon.match.any,
            sinon.match(pagination)
          ).should.equal(true);
          done();
        });
    });

    it('returns 500 when a VAN error occurs', function(done) {
      getQuestionsResponseHandler.forceBadRequest = true;
      supertest(app)
        .get('/' + questionsEndpoint)
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(500, function(err, res) {
          var body = JSON.parse(res.text);

          body.response_code.should.equal(500);
          body.resource_status[0].errors[0].code.should.equal('UNKNOWN');

          done();
        });
    });

    it('returns 404 when SQs not found in VAN', function(done) {
      getQuestionsResponseHandler.forceNotFound = true;
      supertest(app)
        .get('/' + questionsEndpoint)
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
        .expect(404, done);
    });
  });
});
