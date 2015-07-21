var vanRequestBuilder = require('./van-request-builder'),
    _ = require('lodash'),
    BPromise = require('bluebird');

function peopleClient(vanHTTP) {

  var client = vanHTTP;

  return {
    getOne: function(id, expand) {
      var params = {};
      vanRequestBuilder.addPaginationParameters(params, '', '', expand);

      return client.getResource('people/' + id, params);
    },

    findOrCreate: function(matchCandidate) {
      return client.postResource('people/findOrCreate', matchCandidate);
    },

    applyActivistCodes: function(vanId, activistCodeIds) {
      if (!_.isArray(activistCodeIds) || activistCodeIds.length < 1) {
        return BPromise.resolve();
      }
    
      var responses = _.map(activistCodeIds, function (activistCodeId) {
        return {
          'action': 'Apply',
          'type': 'ActivistCode',
          'activistCodeId': activistCodeId
        };
      });
    
      return client.postResource('people/' + vanId + '/canvassResponses',
        {
          'responses': responses
        }).then(function(b) { console.log('got b..', b); });
    }
  }
}

module.exports = peopleClient;
