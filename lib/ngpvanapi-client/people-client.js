var vanClient = require('./van-client');

function handleResponse(success, badRequest, unauthorized) {
  return function(err, response, body) {
    if (err) {
      return badRequest(err);
    }

    if ((response.statusCode == 200) ||
        (response.statusCode == 302) ||
        (response.statusCode == 201) ||
        (response.statusCode == 204)) {
      return success(body);
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

function findOrCreate(vanEndpoint, apiKey, dbMode, person,
  unauthorized, badRequest, success) {

  var path = vanEndpoint + 'people/findOrCreate';
  vanClient.post(path, apiKey, dbMode, person,
    handleResponse(success, badRequest, unauthorized));
}

module.exports = {
  findOrCreate: findOrCreate
};
