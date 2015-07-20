var _ = require('lodash'),
    vanRequestBuilder = require('./van-request-builder');

function activistCodesClient(vanHTTP) {
  
  var client = vanHTTP;
  
  return {
    getOne: function(id) {
      return client.getResource('/activistCodes/' + id);
    },
    
    getMany: function(statuses, name, acType, top, skip) {
      var params = {};
      
      if (statuses && _.isArray(statuses) && statuses.length > 0) {
        params.statuses = _(statuses).join(',');
      }
      
      if (name) {
        params.name = name;
      }
      
      if (acType) {
        params.type = acType;
      }
      
      vanRequestBuilder.addPaginationParameters(params, top, skip);
      
      return client.getResource('/activistCodes', params);
    }
  };
}

module.exports = activistCodesClient;