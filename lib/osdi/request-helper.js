var auth = require('basic-auth');

function getCredentials(req) {
  var user = auth(req);
  var pass = user.pass;

  if (typeof pass !== 'string') {
    return {};
  }

  var parts = pass.split('|');
  return { apiKey: parts[0], dbMode: parts[1] };
}

module.exports = {
  getCredentials: getCredentials
};
