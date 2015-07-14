
var ngpvanAPIClient = require('./ngpvan-api-client'),
    config = require('../config');

function getCredentials(apiToken) {
  if (typeof apiToken !== 'string') {
    return {};
  }

  var parts = apiToken.split('|');
  return { apiKey: parts[0], dbMode: parts[1] };
}

module.exports = function(apiToken) {
  var endpoint = config.get('vanEndpoint');
  var credentials = getCredentials(apiToken);
  
  return ngpvanAPIClient.van(endpoint, credentials.apiKey, credentials.dbMode);
};