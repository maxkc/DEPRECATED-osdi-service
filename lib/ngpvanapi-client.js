 
var config = require('../config'),
    request = require('request');

var vanEndpoint = 'https://api.securevan.com/v4';

function echo(apiKey, message, success, failedAuth, catchErr) {
  var url = vanEndpoint + '/echoes/' + message;

  request(url, function(error, response, body) {
    if (error) {
      return catchErr(error);
    }

    if (response.statusCode == 401) {
      return failedAuth();
    }

    if (response.statusCode == 200) {
      return success(body.message);
    }
  });
}

function getActivistCode(apiKey, dbMode, id, unauthorized, badRequest, success) {
  var options = {
    method: 'GET',
    url: config.get('vanEndpoint') + 'activistCodes/' + id,
    headers: { 'Content-Type': 'application/json' },
    auth: { user: 'api', pass: apiKey + '|' + dbMode, sendImmediately: false }
  };
  
  request(options, function(error, response, body) {
    if (error) {
      return badRequest(error);
    }
    else if (response.statusCode == 200) {
      return success(body);
    }
    else if (response.statusCode == 404) {
      return success({});
    }
    else if (response.statusCode == 401) {
      return unauthorized();
    }
  });
}

module.exports = {
  getActivistCode: getActivistCode
};

