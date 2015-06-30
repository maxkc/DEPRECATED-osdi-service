/*global describe */

require('should');

var config = require('../config.js'),
    testService = require('./testService.js'),
    util = require('./common-tests');

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
  util.runCommonTests('question', testService.createSurveyQuestions,
    'surveyQuestion', validateQuestion);
});
