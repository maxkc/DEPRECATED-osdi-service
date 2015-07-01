var contentType = require('../middleware/contentType'),
    ngpvanAPIClient = require('../lib/ngpvanapi-client'),
    osdi = require('../lib/osdi'),
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
  vanRequest.getOne(req, res, 'tags', validate,
    translate, ngpvanAPIClient.activistCodes);
}

function getAll(req, res) {
  vanRequest.getAll(req, res, 'tags', translate,
    ngpvanAPIClient.activistCodes);
}

module.exports = function (app) {
  app.get('/api/v1/tags', contentType, getAll);
  app.get('/api/v1/tags/:id', contentType, getOne);
};
