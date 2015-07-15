
var ngpvanAPIClient = require('./ngpvan-api-client'),
    osdi = require('../lib/osdi'),
    config = require('../config');

function getCredentials(apiToken) {
  if (typeof apiToken !== 'string') {
    return {};
  }

  var parts = apiToken.split('|');
  return { apiKey: parts[0], dbMode: parts[1] };
}

module.exports = function(req) {
  var endpoint = config.get('vanEndpoint');
  
  var apiToken = osdi.request.getAPIToken(req);
  var credentials = getCredentials(apiToken);
  
  return ngpvanAPIClient.van(endpoint, credentials.apiKey, credentials.dbMode);
};