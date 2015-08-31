
var config = require('../config');

module.exports = function (req, res, next) {
  if (config.get('requireHttps')) {
    if (!isSecureRequest(req)) {
      return sendHTTPSRequired(req, res);
    }
  }

  next();
};

function isSecureRequest(req) {
  var headers = req.headers || {};
  var forwarded = headers['x-forwarded-proto'];

  if ((typeof forwarded === 'string') && (forwarded.indexOf('https') >= 0)) {
    return true;
  }
  else {
    return false;
  }
}


function sendHTTPSRequired(req, res) {
  var responseCode = 400;
  var error = {
    'request_type': 'atomic',
    'response_code': responseCode,
    'resource_status': [
      {
        'resource': '*',
        'response_code': responseCode,
        'errors': [
          {
            'code': 'HTTPS_REQUIRED',
            'description': 'The system does not accept non-https calls.'
          }
        ]
      }
    ]
  };

  return res.status(responseCode).send(error).end();
}
