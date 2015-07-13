var _ = require('lodash');

function peopleClient(vanHTTP) {
  
  var client = vanHTTP;
  
  return {
    getOne: function(id) {
      return client.getResource('/people/' + id);
    }
  };
}

module.exports = peopleClient;