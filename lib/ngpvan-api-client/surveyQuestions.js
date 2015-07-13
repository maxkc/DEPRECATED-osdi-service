var _ = require('lodash'),
    vanRequestBuilder = require('./van-request-builder');


function surveyQuestionsClient(vanHTTP) {
  
  var client = vanHTTP;
  
  return {
    getOne: function(id) {
      return client.getResource('/surveyQuestions/' + id);
    },
    
    getMany: function(statuses, name, acType, question, cycle, top, skip) {
      var params = {};
      
      if (statuses && _.isArray(statuses) && statuses.length > 0) {
        params.statuses = _(statuses).join(",");
      }
      
      if (name) {
        params.name = name;
      }
      
      if (acType) {
        params.type = acType;
      }
      
      if (question) {
        params.question = question;
      }
      
      if (cycle) {
        params.cycle = cycle;
      }
      
      vanRequestBuilder.addPaginationParameters(params, top, skip);
      
      return client.getResource('/surveyQuestions', params);
    }
  }
};

module.exports = surveyQuestionsClient;
