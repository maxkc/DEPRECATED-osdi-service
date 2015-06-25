
var request = require('request');

function getActivistCode(vanEndpoint, apiKey, dbMode, id,
  unauthorized, badRequest, success) {
  var options = {
    method: 'GET',
    url: vanEndpoint + 'activistCodes/' + id,
    headers: { 'Content-Type': 'application/json' },
    auth: { user: 'api', pass: apiKey + '|' + dbMode }
  };

  request(options, function(error, response, body) {
    if (error) {
      return badRequest(error);
    }
    else if (response.statusCode == 200) {
      var successAnswer = JSON.parse(body);
      return success(successAnswer);
    }
    else if (response.statusCode == 400) {
      var badRequestAnswer = JSON.parse(body);
      return badRequest(null, badRequestAnswer);
    }
    else if (response.statusCode == 404) {
      return success({});
    }
    else if ((response.statusCode == 401) ||
      (response.statusCode == 403)) {
      return unauthorized();
    }
  });
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

function getActivistCodes(vanEndpoint, pagination, apiKey, dbMode, unauthorized,
    badRequest, success) {

  var endpoint = vanEndpoint + 'activistCodes';
  var queryString = getVanPaginationParams(pagination);
  if (queryString) {
    endpoint += '?' + queryString;
  }

  var options = {
    method: 'GET',
    url: endpoint,
    headers: { 'Content-Type': 'application/json' },
    auth: { user: 'api', pass: apiKey + '|' + dbMode }
  }

  request(options, function(err, response, body) {
    if (err) {
      return badRequest(err);
    }

    if (response.statusCode == 200) {
      return success(JSON.parse(body));
    } else if (response.statusCode == 400) {
      var badRequestAnswer = JSON.parse(body);
      return badRequest(null, badRequestAnswer);
    }
    else if (response.statusCode == 404) {
      return success({});
    }
    else if ((response.statusCode == 401) ||
      (response.statusCode == 403)) {
      return unauthorized();
    }

  });
};

module.exports = {
  getActivistCode: getActivistCode,
  getActivistCodes: getActivistCodes
};

