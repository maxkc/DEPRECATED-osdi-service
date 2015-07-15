var config = require('../../config');

function getAPIToken(req) {
  if (!req || !req.headers || !req.headers || 
      !req.headers['osdi-api-token']) {
    return '';
  }
  return req.headers['osdi-api-token'];
}

function getPaginationOptions(req) {
  var options = {};
  if (!req || !req.query) {
    return options;
  }

  var query = req.query;
  if (query.per_page) {
    options.perPage = parseInt(query.per_page, 10);
  }
  else {
    // TODO: remove this, not really an OSDI property
    options.perPage = config.get('defaultVanPageSize');    
  }

  if (query.page) {
    // TODO: shouldn't this be 1, not 10?  default page number is 1 right?
    options.page = parseInt(query.page, 10);
  }

  return options;
}

module.exports = {
  getAPIToken: getAPIToken,
  getPaginationOptions: getPaginationOptions
};