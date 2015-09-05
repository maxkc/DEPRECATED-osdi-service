var _ = require('lodash'),
    ngpvanErrors = require('../lib/ngpvan-api-client').errors,
    BPromise = require('bluebird');

function createVANServiceMock(resource, method, 
  responseBody, exception) {

  var service = {};
  var service[resource] = {};
  var service[resource][method] = function() {
    return new BPromise(resolve) {
      if (exception) {
        throw exception;
      }
      else {
        resolve(responseBody);
      }
    };
  };

  var clientMock = {
    '@global': true,
    van: service,
    errors:
  };

  var mocks = {'../lib/ngpvan-api-client': clientMock};
}

function createActivistCodes(count) {
  var acs = [];
  for (var i = 0; i < count; i++) {
    var ac = {
      activistCodeId: i,
      name: 'AC ' + i,
      description: 'Activist Code ' + i
    };
    acs.push(ac);
  }
  return acs;
}

function createSurveyQuestions(count) {
  var sqs = [];
  for (var i = 0; i < count; i++) {
    var sq = {
      surveyQuestionId: i,
      name: 'SQ ' + i,
      description: 'Survey Question ' + i,
      mediumName: 'SurveyQ',
      scriptQuestion: 'Survey Question?',
      responses: []
    };
    var responseCount = _.random(10);
    for (var j = 0; j < responseCount; j++) {
      sq.responses.push({
        surveyResponseId: _.random(0, 10000),
        mediumName: 'SR ' + j,
        name: 'Survey Response ' + j
      });
    }
    sqs.push(sq);
  }
  return sqs;
}

module.exports = {
  createVANServiceMock: createVANServiceMock,
  createActivistCodes: createActivistCodes,
  createSurveyQuestions: createSurveyQuestions
};
