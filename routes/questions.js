var contentType = require('../middleware/contentType'),
    ngpvanAPIClient = require('../lib/ngpvanapi-client'),
    osdi = require('../lib/osdi'),
    vanRequest = require('../lib/van-request-helper');

function translate(sq) {
  var answer = osdi.response.createCommonItem(
    sq.mediumName,
    sq.scriptQuestion);
  answer.title = sq.name;
  answer.summary = answer.description;
  answer.question_type = 'SingleChoice';
  osdi.response.addIdentifier(answer, 'VAN:' + sq.surveyQuestionId);
  osdi.response.addSelfLink(answer, 'questions', sq.surveyQuestionId);

  answer.responses = (sq.responses || []).map(function(response) {
    return {
      key: response.surveyResponseId,
      name: response.mediumName,
      title: response.name
    };
  });
  return answer;
}

function validate(surveyQuestion, id) {
  return surveyQuestion &&
         typeof surveyQuestion.surveyQuestionId !== 'undefined' &&
         parseInt(surveyQuestion.surveyQuestionId) === id;
}

function getOne(req, res) {
  vanRequest.getOne(req, res, 'questions', validate,
    translate, ngpvanAPIClient.surveyQuestions);
}

function getAll(req, res) {
  vanRequest.getAll(req, res, 'questions', translate,
    ngpvanAPIClient.surveyQuestions);
}


module.exports = function (app) {
  app.get('/api/v1/questions', contentType, getAll);
  app.get('/api/v1/questions/:id', contentType, getOne);
};
