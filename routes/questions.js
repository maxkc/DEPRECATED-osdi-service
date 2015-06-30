
var contentType = require('../middleware/contentType'),
    config = require('../config'),
    ngpvanAPIClient = require('../lib/ngpvanapi-client'),
    osdi = require('../lib/osdi');

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

function getOne(req, res) {
  var id = 0;

  if (req && req.params && req.params.id) {
    id = parseInt(req.params.id);
  }

  var success = function(surveyQuestion) {
    if (!surveyQuestion ||
        typeof surveyQuestion.surveyQuestionId === 'undefined' ||
        parseInt(surveyQuestion.surveyQuestionId) !== id) {

      return res.status(404).end();
    }

    var answer = translateSurveyQuestionToQuestion(surveyQuestion);

    return res.status(200).send(answer);
  };

  var credentials = osdi.request.getCredentials(req);

  ngpvanAPIClient.surveyQuestions.getOne(vanEndpoint,
    credentials.apiKey, credentials.dbMode, id,
    osdi.response.unauthorized(res), osdi.response.badRequest(res), success);
}

function getAll(req, res) {
  var pagination = osdi.response.getPaginationOptions(req);

  var success = function(surveyQuestions) {
    if (!(surveyQuestions && surveyQuestions.items)) {
      return res.status(404).end();
    }

    var page = pagination.page;
    var perPage = pagination.perPage;
    var totalRecords = surveyQuestions.count;

    var totalPages = Math.ceil(totalRecords / perPage);
    var answer = osdi.response.createPaginatedItem(page, perPage, totalPages,
      totalRecords, 'questions');

    var items = surveyQuestions.items;

    osdi.response.addEmbeddedItems(answer, items, translateSurveyQuestionToQuestion);
    return res.status(200).send(answer);
  };

  var credentials = osdi.request.getCredentials(req);

  ngpvanAPIClient.surveyQuestions.getAll(vanEndpoint, pagination,
    credentials.apiKey, credentials.dbMode,
    osdi.response.unauthorized(res), osdi.response.badRequest(res), success);
}

module.exports = function (app) {
  app.get('/api/v1/questions', contentType, getAll);
  app.get('/api/v1/questions/:id', contentType, getOne);
};
