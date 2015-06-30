
var contentType = require('../middleware/contentType'),
    config = require('../config'),
    ngpvanAPIClient = require('../lib/ngpvanapi-client'),
    osdi = require('../lib/osdi');

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
  var id = 0;

  if (req && req.params && req.params.id) {
    id = parseInt(req.params.id);
  }

  var success = function(activistCode) {
    if (!activistCode ||
        typeof activistCode.activistCodeId === 'undefined' ||
        parseInt(activistCode.activistCodeId) !== id) {

      return res.status(404).end();
    }

    var answer = translateActivistCodeToTag(activistCode);

    return res.status(200).send(answer);
  };

  var credentials = osdi.request.getCredentials(req);

  ngpvanAPIClient.activistCodes.getOne(vanEndpoint,
    credentials.apiKey, credentials.dbMode, id,
    osdi.response.unauthorized(res), osdi.response.badRequest(res), success);
}

function getAll(req, res) {
  var pagination = osdi.response.getPaginationOptions(req);

  var success = function(activistCodes) {
    if (!(activistCodes && activistCodes.items)) {
      return res.status(404).end();
    }

    var page = pagination.page;
    var perPage = pagination.perPage;
    var totalRecords = activistCodes.count;

    var totalPages = Math.ceil(totalRecords / perPage);
    var answer = osdi.response.createPaginatedItem(page, perPage, totalPages,
      totalRecords, 'tags');

    var items = activistCodes.items;

    osdi.response.addEmbeddedItems(answer, items, translateActivistCodeToTag);
    return res.status(200).send(answer);
  };

  var credentials = osdi.request.getCredentials(req);

  ngpvanAPIClient.activistCodes.getAll(vanEndpoint, pagination,
    credentials.apiKey, credentials.dbMode,
    osdi.response.unauthorized(res), osdi.response.badRequest(res), success);
}

module.exports = function (app) {
  app.get('/api/v1/tags', contentType, getAll);
  app.get('/api/v1/tags/:id', contentType, getOne);
};
