var config = require('../config'),
    osdi = require('./osdi');

var vanEndpoint = config.get('vanEndpoint');

function getAll(req, res, osdiType, translator, client) {
  var pagination = osdi.response.getPaginationOptions(req);

  var success = function(vanResponse) {
    if (!(vanResponse && vanResponse.items)) {
      return res.status(404).end();
    }

    var page = pagination.page;
    var perPage = pagination.perPage;
    var totalRecords = vanResponse.count;

    var totalPages = Math.ceil(totalRecords / perPage);
    var answer = osdi.response.createPaginatedItem(page, perPage, totalPages,
      totalRecords, osdiType);

    var items = vanResponse.items;

    osdi.response.addEmbeddedItems(answer, items, translator);
    return res.status(200).send(answer);
  };

  var credentials = osdi.request.getCredentials(req);

  client.getAll(vanEndpoint, pagination,
    credentials.apiKey, credentials.dbMode,
    osdi.response.unauthorized(res), osdi.response.badRequest(res), success);
}

function getOne(req, res, osdiType, validate, translate, client) {
  var id = 0;

  if (req && req.params && req.params.id) {
    id = parseInt(req.params.id);
  }

  var success = function(vanResponse) {
    if (!validate(vanResponse, id)) {

      return res.status(404).end();
    }

    var answer = translate(vanResponse);

    return res.status(200).send(answer);
  };

  var credentials = osdi.request.getCredentials(req);

  client.getOne(vanEndpoint,
    credentials.apiKey, credentials.dbMode, id,
    osdi.response.unauthorized(res), osdi.response.badRequest(res), success);
}

module.exports = {
  getAll: getAll,
  getOne: getOne
};
