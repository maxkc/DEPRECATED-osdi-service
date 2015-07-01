var vanClient = require('./van-client');

function getOne(vanEndpoint, apiKey, dbMode, id,
  unauthorized, badRequest, success) {

  var path = vanEndpoint + 'activistCodes/' + id;

  vanClient.get(path, apiKey, dbMode,
    vanClient.handleResponse(success, badRequest, unauthorized));
}

function getAll(vanEndpoint, pagination, apiKey, dbMode, unauthorized,
    badRequest, success) {

  var path = vanEndpoint + 'activistCodes';

  var queryString = vanClient.getVanPaginationParams(pagination);
  if (queryString) {
    path += '?' + queryString;
  }

  vanClient.get(path, apiKey, dbMode,
    vanClient.handleResponse(success, badRequest, unauthorized));
}

module.exports = {
  getOne: getOne,
  getAll: getAll
};
