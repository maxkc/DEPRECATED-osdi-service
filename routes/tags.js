
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
          'resource': 'osd:tags',
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

function translateActivistCodeToTag(activistCode) {
    var answer = osdi.createCommonItem(
      activistCode.name,
      activistCode.description);

    osdi.addIdentifier(answer, 'VAN:' + activistCode.activistCodeId);
    osdi.addSelfLink(answer, 'tags', activistCode.activistCodeId);
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

  var credentials = getCredentials(req);

  ngpvanAPIClient.activistCodes.getOne(vanEndpoint,
    credentials.apiKey, credentials.dbMode, id,
    unauthorized(res), badRequest(res), success);
}

function getAll(req, res) {
  var pagination = osdi.getPaginationOptions(req);

  var success = function(activistCodes) {
    if (!(activistCodes && activistCodes.items)) {
      return res.status(404).end();
    }

    var page = pagination.page;
    var perPage = pagination.perPage;
    var totalRecords = activistCodes.count;

    var totalPages = Math.ceil(totalRecords / perPage);
    var answer = osdi.createPaginatedItem(page, perPage, totalPages,
      totalRecords, 'tags');

    var items = activistCodes.items;

    osdi.addEmbeddedItems(answer, items, translateActivistCodeToTag);
    return res.status(200).send(answer);
  };

  var credentials = getCredentials(req);

  ngpvanAPIClient.activistCodes.getAll(vanEndpoint, pagination,
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
  app.get('/api/v1/tags', contentType, getAll);
  app.get('/api/v1/tags/:id', contentType, getOne);
};
