var config = require('../config'),
    osdi = require('../lib/osdi'),
    bridge = require('../lib/bridge');

function getAll(req, res) {
  var vanClient = bridge.createClient(req);
  var vanPaginationParams = bridge.getVANPaginationParams(req);

  var resourcePromise = vanClient.surveyQuestions.getMany(null, null, null,
    null, null, vanPaginationParams.top, vanPaginationParams.skip);

  bridge.sendMultiResourceResponse(resourcePromise, vanPaginationParams,
    oneResourceTranslator, 'questions', res);
}

function getOne(req, res) {
  var vanClient = bridge.createClient(req);

  var id = 0;
  if (req && req.params && req.params.id) {
    id = req.params.id;
  }

  var resourcePromise = vanClient.surveyQuestions.getOne(id);

  bridge.sendSingleResourceResponse(resourcePromise, oneResourceTranslator,
    'questions', res);
}

function oneResourceTranslator(sq) {
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
  osdi.response.addCurie(answer, config.get('curieTemplate'));

  return answer;
}

module.exports = function (app) {
  app.get('/api/v1/questions', getAll);
  app.get('/api/v1/questions/:id', getOne);
};
