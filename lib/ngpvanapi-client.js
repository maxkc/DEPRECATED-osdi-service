 
var request = require('request');

function getActivistCode(vanEndpoint, apiKey, dbMode, id, unauthorized, badRequest, success) {
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
      var answer = JSON.parse(body);
      return success(answer);
    }
    else if (response.statusCode == 400) {
      var answer = JSON.parse(body);
      return badRequest(null, answer);
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

module.exports = {
  getActivistCode: getActivistCode
};

