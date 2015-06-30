
var contentType = require('../middleware/contentType'),
    config = require('../config'),
    ngpvanAPIClient = require('../lib/ngpvanapi-client'),
    osdi = require('../lib/osdi'),
    vanRequest = require('../lib/van-request-helper');

var vanEndpoint = config.get('vanEndpoint');

function translateActivistCodeToTag(activistCode) {
    var answer = osdi.response.createCommonItem(
      activistCode.name,
      activistCode.description);

  osdi.response.addIdentifier(answer, 'VAN:' + activistCode.activistCodeId);
  osdi.response.addSelfLink(answer, 'tags', activistCode.activistCodeId);
  return answer;
}

function getOne(req, res) {
  vanRequest.getOne(req, res, 'tags', validate, translateActivistCodeToTag, ngpvanAPIClient.activistCodes);
}

function validate(activistCode, id) {
  return activistCode &&
         typeof activistCode.activistCodeId !== 'undefined' &&
         parseInt(activistCode.activistCodeId) === id;
}

function getAll(req, res) {
  vanRequest.getAll(req, res, 'tags', translateActivistCodeToTag, ngpvanAPIClient.activistCodes);
}

module.exports = function (app) {
  app.get('/api/v1/tags', contentType, getAll);
  app.get('/api/v1/tags/:id', contentType, getOne);
};
