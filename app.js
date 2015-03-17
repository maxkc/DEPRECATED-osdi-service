/*jslint nodejs: true*/

var express = require('express'),
    iefix = require('express-ie-cors'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    app = module.exports = express();

app.use(iefix({ contentType: 'application/x-www-form-urlencoded' }));
app.use(bodyParser.json());
app.use(cors());

function notSupported(req, res) {
  var error = {
    "request_type": "atomic",
    "response_code": 500,
    "resource_status": [
      {
        "resource": "*",
        "response_code": 500,
        "errors": [
          {
            "code": "NOT_SUPPORTED",
            "description": "The system does not support resources of this type."
          }
        ]
      }
    ]
  };

  return res.status(400).send(error);
}

app.get('/api/v1/', notSupported);

if (!module.parent) {
  var port = 4000;
  app.listen(port, function() {
    console.log('Listening on %d.', port);
  });
}

