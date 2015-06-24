
var contentType = require('../middleware/contentType'),
    config = require('../config'),
    auth = require('basic-auth'),
    ngpvanAPIClient = require('../lib/ngpvanapi-client'),
    osdi = require('../lib/osdi');

var root = config.get('apiEndpoint');
var vanEndpoint = config.get('vanEndpoint');

var unauthorized = function() {
  return res.status(401).end();
};


function badRequest(error) {
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

function getOne(req, res) {
  var id = 0;

  if (req && req.params && req.params.id) {
    id = parseInt(req.params.id);
  }

  var success = function(activistCode) {
    if (!activistCode || !activistCode.activistCodeId ||
      parseInt(activistCode.activistCodeId) !== id) {

      return res.status(404).end();
    }

    var answer = osdi.createCommonItem(
      activistCode.name,
      activistCode.description);

    osdi.addIdentifier(answer, 'VAN:' + activistCode.activistCodeId);
    osdi.addLink(answer, 'self', 'tags/' + id);

    return res.status(200).send(answer);
  };

  var credentials = getCredentials(req);

  ngpvanAPIClient.getActivistCode(vanEndpoint,
    credentials.apiKey, credentials.dbMode, id,
    unauthorized, badRequest, success);
}

function getAll(req, res) {

  var success = function(activistCodes) {
    if (!(activistCodes && activistCodes.items)) {
      return res.status(404).end();
    }

    var answer = {
      "total_pages": 99,
      "per_page": 30,
      "page": 2,
      "total_records": 250,
      "data": activistCodes,
      "_links": {

      },
      "_embedded": {
        "osdi:tags": [
          {
            "identifiers": [
              "VAN:1234"
            ],
            "origin_system": "VAN",
            "created_date": "blah",
            "modified_date": "bleh",
            "name": "Volunteers",
            "description": "volunteers are people who volunteer",
            "_links": {
              "self": {
                "href": "van_url"
            }, "osdi:taggings":{}
          }
          }
        ]
      }
    };

    return res.status(200).send(answer);
  };

  var credentials = getCredentials(req);


  ngpvanAPIClient.getActivistCodes(vanEndpoint,
    credentials.apiKey, credentials.dbMode,
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
  app.get('/api/v1/tags', contentType, getAll);
  app.get('/api/v1/tags/:id', contentType, getOne);
};


