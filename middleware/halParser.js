
module.exports = function (req, res, next) {
  try {
    var rawBody = req.body;

    if (typeof rawBody !== 'object') {
      var parsedBody = JSON.parse(rawBody);
      req.body = parsedBody;
    }
  }
  catch (e) {
    console.trace('Exception while parsing body: ', req.body, e);
    return sendBadJSON(req, res);
  }

  next();
};


function sendBadJSON(req, res) {
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
            'code': 'BAD_JSON',
            'description': 'The request body could not be parsed as valid JSON.'
          }
        ]
      }
    ]
  };

  return res.status(responseCode).send(error).end();
}

