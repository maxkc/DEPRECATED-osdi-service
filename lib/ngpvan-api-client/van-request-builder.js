
var _ = require('lodash');

function addPaginationParameters(params, top, skip, expand) {
  if (top) {
    params['$top'] = top;
  }
  
  if (skip) {
    params['$skip'] = skip;
  }
  
  if (expand && _.isArray(expand) && expand.length > 0) {
    params['$expand'] = _(expand).join(",");
  }
}

module.exports = {
  addPaginationParameters: addPaginationParameters
}