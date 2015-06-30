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
      surveyQuestions: {
        getOne:
         getQuestionResponseHandler.handle.bind(getQuestionResponseHandler),
        getAll:
         getQuestionsResponseHandler.handle.bind(getQuestionsResponseHandler),
      }
    };

    sinon.spy(clientMock.surveyQuestions, 'getOne');
    sinon.spy(clientMock.surveyQuestions, 'getAll');

    var mocks = {'../lib/ngpvanapi-client': clientMock};
    app = proxyquire('../app.js', mocks);
  });

  function getQuestion() {
    return supertest(app)
      .get('/' + questionsEndpoint + '/' + sq.surveyQuestionId)
      .set('Accept', 'application/hal+json')
      .auth('api_test', 'guid-goes-here|0');
  }

  describe('GET questions/questionId', function() {
    it('returns a translated question from VAN for valid question ID', function(done) {
      getQuestionResponseHandler.forceSuccess = true;
      getQuestion().expect(200, function(err, res) {
        var body = JSON.parse(res.text);
        validateQuestion(sq, body);
        done();
      });
    });

    it('returns 500 when a VAN error occurs', function(done) {
      getQuestionResponseHandler.forceBadRequest = true;
      getQuestion().expect(500, function(err, res) {
        var body = JSON.parse(res.text);

        body.response_code.should.equal(500);
        body.resource_status[0].errors[0].code.should.equal('UNKNOWN');

        done();
      });
    });

    it('returns 404 when SQ not found in VAN', function(done) {
      getQuestionResponseHandler.forceNotFound = true;
      getQuestion().expect(404, done);
    });

  });

  describe('GET questions', function() {
    function getQuestions(query) {
      return supertest(app)
        .get('/' + questionsEndpoint + (query || ''))
        .set('Accept', 'application/hal+json')
        .auth('api_test', 'guid-goes-here|0')
    }

    it('returns translated questions from VAN', function(done) {
      getQuestionsResponseHandler.forceSuccess = true;
      getQuestions().expect(200, function(err, res) {
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
      getQuestions('?page=3&per_page=5').expect(200, function() {
        clientMock.surveyQuestions.getAll.calledWith(
          sinon.match.any,
          sinon.match(pagination)
        ).should.equal(true);
        done();
      });
    });

    it('returns 500 when a VAN error occurs', function(done) {
      getQuestionsResponseHandler.forceBadRequest = true;
      getQuestions().expect(500, function(err, res) {
        var body = JSON.parse(res.text);

        body.response_code.should.equal(500);
        body.resource_status[0].errors[0].code.should.equal('UNKNOWN');

        done();
      });
    });

    it('returns 404 when SQs not found in VAN', function(done) {
      getQuestionsResponseHandler.forceNotFound = true;
      getQuestions().expect(404, done);
    });
  });
});
