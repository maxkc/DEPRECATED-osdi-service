
function getAPIToken(req) {
  if (!req || !req.headers || !req.headers || 
      !req.headers['OSDI-API-Token']) {
    return '';
  }
  return req.headers['OSDI-API-Token'];
}

module.exports = {
  getAPIToken: getAPIToken
};