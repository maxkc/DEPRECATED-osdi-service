
var request = require('request');

function getActivistCode(vanEndpoint, apiKey, dbMode, id,
  unauthorized, badRequest, success) {

  var path = vanEndpoint + 'activistCodes/' + id;
  var pass = apiKey + '|' + dbMode;

  get(path, pass, handleResponse(success, badRequest, unauthorized));
}

function getActivistCodes(vanEndpoint, pagination, apiKey, dbMode, unauthorized,
    badRequest, success) {

  var path = vanEndpoint + 'activistCodes';
  var pass = apiKey + '|' + dbMode;

  var queryString = getVanPaginationParams(pagination);
  if (queryString) {
    path += '?' + queryString;
  }

  get(path, pass, handleResponse(success, badRequest, unauthorized));
}

function get(path, pass, callback) {
  var options = {
    method: 'GET',
    url: path,
    headers: {'Content-Type': 'application/json'},
    auth: {user: 'api', pass: pass}
  };

  request(options, callback);
}

function getVanPaginationParams(pagination) {
  var query;
  if (pagination.page && pagination.perPage) {
    var skip = (pagination.page - 1) * pagination.perPage;
    query = '$top=' + pagination.perPage + '&$skip=' + skip;
  } else if (pagination.perPage) {
    query = '$top=' + pagination.perPage;
  }
  return query;
}

function handleResponse(success, badRequest, unauthorized) {
  return function(err, response, body) {
    if (err) {
      return badRequest(err);
    }

    if (response.statusCode == 200) {
      return success(JSON.parse(body));
    }

    if (response.statusCode == 400) {
      var badRequestAnswer = JSON.parse(body);
      return badRequest(null, badRequestAnswer);
    }

    if (response.statusCode == 404) {
      return success({});
    }

    if ((response.statusCode == 401) ||
      (response.statusCode == 403)) {
      return unauthorized();
    }
  };
}


module.exports = {
  getActivistCode: getActivistCode,
  getActivistCodes: getActivistCodes
};

