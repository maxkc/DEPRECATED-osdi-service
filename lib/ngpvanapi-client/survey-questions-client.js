var util = require('./client-util');
var request = require('request');

function getOne(vanEndpoint, apiKey, dbMode, id,
  unauthorized, badRequest, success) {

  var path = vanEndpoint + 'surveyQuestions/' + id;
  var pass = apiKey + '|' + dbMode;

  util.get(path, pass, util.handleResponse(success, badRequest, unauthorized));
}

function getAll(vanEndpoint, pagination, apiKey, dbMode, unauthorized,
    badRequest, success) {

  var path = vanEndpoint + 'surveyQuestions';
  var pass = apiKey + '|' + dbMode;

  var queryString = util.getVanPaginationParams(pagination);
  if (queryString) {
    path += '?' + queryString;
  }

  util.get(path, pass, util.handleResponse(success, badRequest, unauthorized));
}


module.exports = {
  getOne: getOne,
  getAll: getAll
};
