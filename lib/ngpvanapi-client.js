 
var request = require('request');

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

module.exports = {
  echo: echo
};

