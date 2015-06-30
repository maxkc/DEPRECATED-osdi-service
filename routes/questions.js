
var contentType = require('../middleware/contentType'),
    config = require('../config'),
    ngpvanAPIClient = require('../lib/ngpvanapi-client'),
    osdi = require('../lib/osdi'),
    vanRequest = require('../lib/van-request-helper');

var vanEndpoint = config.get('vanEndpoint');

function translateSurveyQuestionToQuestion(surveyQuestion) {
  var answer = osdi.response.createCommonItem(
    surveyQuestion.mediumName,
    surveyQuestion.scriptQuestion);
  answer.title = surveyQuestion.name;
  answer.summary = answer.description;
  answer.question_type = 'SingleChoice';
  osdi.response.addIdentifier(answer, 'VAN:' + surveyQuestion.surveyQuestionId);
  osdi.response.addSelfLink(answer, 'questions', surveyQuestion.surveyQuestionId);

  answer.responses = (surveyQuestion.responses || []).map(function(response) {
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
  vanRequest.getOne(req, res, 'questions', validate, translateSurveyQuestionToQuestion, ngpvanAPIClient.surveyQuestions);
}

function getAll(req, res) {
  vanRequest.getAll(req, res, 'questions', translateSurveyQuestionToQuestion, ngpvanAPIClient.surveyQuestions);
}


module.exports = function (app) {
  app.get('/api/v1/questions', contentType, getAll);
  app.get('/api/v1/questions/:id', contentType, getOne);
};
