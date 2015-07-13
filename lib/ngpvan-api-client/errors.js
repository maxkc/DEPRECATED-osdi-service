
var createError = require('createerror');

var Forbidden = createError({
  name: 'Forbidden'
});

function BadRequest() {
  BadRequest.name = 'BadRequest';
}
BadRequest.prototype = new Error;

var BadRequest = createError({
  name: 'BadRequest'
});

var NotFound = createError({
  name: 'NotFound'
});

var Unexpected = createError({
  name: 'Unexpected',
  referenceCode: ''
});

module.exports = {
  Forbidden: Forbidden,
  BadRequest: BadRequest,
  NotFound: NotFound,
  Unexpected: Unexpected
}