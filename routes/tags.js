
var contentType = require('../middleware/contentType'),
    config = require('../config'),
    auth = require('basic-auth'),
    ngpvanAPIClient = require('../lib/ngpvanapi-client');

function getOne(req, res) {
  var id = 0;
  var root = config.get('apiEndpoint');
  var vanEndpoint = config.get('vanEndpoint');


  if (req && req.params && req.params.id) {
    id = parseInt(req.params.id);
  }

  var unauthorized = function() {
    return res.status(401).end();
  };

  var badRequest = function(error) {
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

  var success = function(activistCode) {
    if (!activistCode || !activistCode.activistCodeId || 
      parseInt(activistCode.activistCodeId) !== id) {

      return res.status(404).end();
    }

    var answer = {
      'identifiers': [
        'VAN:' + activistCode.activistCodeId,
      ],
      'origin_system': 'VAN',
      'name': activistCode.name,
      'description': activistCode.description,
      '_links': {
        'self': {
          'href': root + 'tags/' + id
        },
      }
    };

    return res.status(200).send(answer);
  };

  var credentials = getCredentials(req);

  ngpvanAPIClient.getActivistCode(vanEndpoint, 
    credentials.apiKey, credentials.dbMode, id,
    unauthorized, badRequest, success);
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
  app.get('/api/v1/tags/:id', contentType, getOne);
};


