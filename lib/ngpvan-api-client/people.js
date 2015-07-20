var vanRequestBuilder = require('./van-request-builder');

function peopleClient(vanHTTP) {
  
  var client = vanHTTP;
  
  return {
    getOne: function(id, expand) {
      var params = {};
      vanRequestBuilder.addPaginationParameters(params, '', '', expand);
      
      return client.getResource('/people/' + id, params);
    },
    
    findOrCreate: function(matchCandidate) {
      return client.postResource('/people/findOrCreate', matchCandidate);
    }
  };
}

module.exports = peopleClient;