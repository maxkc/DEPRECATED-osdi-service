var contentType = require('../middleware/contentType'),
    ngpvanAPIClient = require('../lib/ngpvan-api-client'),
    osdi = require('../lib/osdi'),
    osdiVANClientFactory = require('./osdi-van-client-factory'),
    vanRequest = require('../lib/van-request-helper');

function translate(ac) {
    var answer = osdi.response.createCommonItem(
      ac.name,
      ac.description);

  osdi.response.addIdentifier(answer, 'VAN:' + ac.activistCodeId);
  osdi.response.addSelfLink(answer, 'tags', ac.activistCodeId);
  return answer;
}

function validate(activistCode, id) {
  return activistCode &&
         typeof activistCode.activistCodeId !== 'undefined' &&
         parseInt(activistCode.activistCodeId) === id;
}

function getOne(req, res) {
  var apiToken = osdi.request.getAPIToken(req);
  var vanClient = osdiVANClientFactory(apiToken);
  
  var id = 0;
  if (req && req.params && req.params.id) {
    id = req.params.id;
  }
  
  vanClient.activistCodes.getOne(id).
    spread(function (activistCode) {
      var tag = translate(activistCode);
      return res.status(200).send(tag);
  });
}

function getAll(req, res) {
  
  vanRequest.getAll(req, res, 'tags', translate,
    ngpvanAPIClient.activistCodes);
}

module.exports = function (app) {
  app.get('/api/v1/tags', contentType, getAll);
  app.get('/api/v1/tags/:id', contentType, getOne);
};
