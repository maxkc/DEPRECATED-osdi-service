
var errors = require('./errors'),
    $http = require('http-as-promised');

function vanHTTP(endpoint, apiKey, dbMode) {

  var myEndpoint = endpoint;
  var myApiKey = apiKey;
  var myDbMode = dbMode;

  function getResource(path, queryStringParams) {
    var pass = myApiKey + '|' + myDbMode;
    var options = {
      headers: { 'Content-Type': 'application/json' },
      auth: { user: 'api', pass: pass }
    };

    if (queryStringParams) {
      options.qs = queryStringParams;
    }

    return $http.get(myEndpoint + path, options).
      spread(function(response) {
        return parseBody(response.body);
      }).
      catch($http.error['400'], function () { throw new errors.BadRequest(); }).
      catch($http.error['401'], function () { throw new errors.Forbidden(); }).
      catch($http.error['403'], function () { throw new errors.Forbidden(); }).
      catch($http.error['404'], function () { throw new errors.NotFound(); }).
      catch($http.error['500'], function (e) {
        var referenceCode = JSON.parse(e.body).errors[0].referenceCode;
        throw new errors.Unexpected({ referenceCode: referenceCode});
      });
  }

  function postResource(path, data) {
    var pass = myApiKey + '|' + myDbMode;

    var options = {
      headers: {'Content-Type': 'application/json'},
      auth: {user: 'api', pass: pass},
      body: JSON.stringify(data)
    };

    return $http.post(myEndpoint + path, options).
      spread(function(response, body) {
        return parseBody(response.body);
      }).
      catch($http.error['400'], function () { throw new errors.BadRequest(); }).
      catch($http.error['401'], function () { throw new errors.Forbidden(); }).
      catch($http.error['403'], function () { throw new errors.Forbidden(); }).
      catch($http.error['404'], function () { throw new errors.NotFound(); }).
      catch($http.error['500'], function (e) {
        var referenceCode = JSON.parse(e.body).errors[0].referenceCode;
        throw new errors.Unexpected({ referenceCode: referenceCode});
      });
  }
  
  function parseBody(body) {
    if (body) {
      return JSON.parse(body);
    }
    else {
      return {};
    }
  }

  return {
    getResource: getResource,
    postResource: postResource
  };
}


module.exports = function (endpoint, apiKey, dbMode) {
  var client = vanHTTP(endpoint, apiKey, dbMode);

  return {
    activistCodes: require('./activistCodes')(client),
    surveyQuestions: require('./surveyQuestions')(client),
    people: require('./people')(client)
  };
};