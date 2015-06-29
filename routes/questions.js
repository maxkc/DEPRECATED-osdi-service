
var contentType = require('../middleware/contentType'),
    config = require('../config'),
    auth = require('basic-auth'),
    ngpvanAPIClient = require('../lib/ngpvanapi-client'),
    osdi = require('../lib/osdi-response-helper');

var vanEndpoint = config.get('vanEndpoint');

var unauthorized = function(res) {
  return function() {
    return res.status(401).end();
  };
};

function badRequest(res) {
  return function(error) {
    var response_code = 500;
    if (!error) {
      response_code = 400;
    }

    var answer = {
      'request_type': 'atomic',
      'response_code': response_code,
      'resource_status': [
        {
          'resource': 'osd:questions',
          'response_code': response_code,
          'errors': [
            {
              'code': 'UNKNOWN',
              'description': 'Translating VAN errors is not yet supported.'
            }
          ]
        }
      ]
    };

    return res.status(response_code).send(answer);
  };
}

function translateSurveyQuestionToQuestion(surveyQuestion) {
    var answer = osdi.createCommonItem(
      surveyQuestion.mediumName,
      surveyQuestion.scriptQuestion);
    answer.title = surveyQuestion.name;
    answer.summary = answer.description;
    answer.question_type = 'SingleChoice';
    osdi.addIdentifier(answer, 'VAN:' + surveyQuestion.surveyQuestionId);
    osdi.addSelfLink(answer, 'questions', surveyQuestion.surveyQuestionId);

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

  var credentials = getCredentials(req);

  ngpvanAPIClient.getSurveyQuestion(vanEndpoint,
    credentials.apiKey, credentials.dbMode, id,
    unauthorized(res), badRequest(res), success);
}

function getAll(req, res) {
  var pagination = osdi.getPaginationOptions(req);

  var success = function(surveyQuestions) {
    if (!(surveyQuestions && surveyQuestions.items)) {
      return res.status(404).end();
    }

    var page = pagination.page;
    var perPage = pagination.perPage;
    var totalRecords = surveyQuestions.count;

    var totalPages = Math.ceil(totalRecords / perPage);
    var answer = osdi.createPaginatedItem(page, perPage, totalPages,
      totalRecords, 'questions');

    var items = surveyQuestions.items;

    osdi.addEmbeddedItems(answer, items, translateSurveyQuestionToQuestion);
    return res.status(200).send(answer);
  };

  var credentials = getCredentials(req);

  ngpvanAPIClient.getSurveyQuestions(vanEndpoint, pagination,
    credentials.apiKey, credentials.dbMode,
    unauthorized(res), badRequest(res), success);
}

function getCredentials(req) {
  var user = auth(req);
  var pass = user.pass;

  if (typeof pass !== 'string') {
    return {};
  }

  var parts = pass.split('|');
  return { apiKey: parts[0], dbMode: parts[1] };
}

module.exports = function (app) {
  app.get('/api/v1/questions', contentType, getAll);
  app.get('/api/v1/questions/:id', contentType, getOne);
};
