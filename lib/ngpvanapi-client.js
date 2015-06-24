
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

function getActivistCodes(vanEndpoint, apiKey, dbMode, unauthorized,
    badRequest, success) {
  var options = {
    method: 'GET',
    url: vanEndpoint + 'activistCodes',
    headers: { 'Content-Type': 'application/json' },
    auth: { user: 'api', pass: apiKey + '|' + dbMode }
  }

  request(options, function(err, response, body) {
    if (err) {
      return badRequest(err);
    }

    if (response.statusCode == 200) {
      return success(JSON.parse(body));
    }
  });
};

module.exports = {
  getActivistCode: getActivistCode,
  getActivistCodes: getActivistCodes
};

