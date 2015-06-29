function VanResponseHandlerMock() {}

VanResponseHandlerMock.prototype.handle =
  function(vanEndpoint, apiKey, dbMode, id,
      unauthorized, badRequest, success) {

    if (this.forceSuccess) {
      return success(this.successData);
    }
    if (this.forceUnauthorized) {
      return unauthorized({});
    }
    if (this.forceNotFound) {
      return success({});
    }

    badRequest({});
  };

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

module.exports = {
  VanResponseHandlerMock: VanResponseHandlerMock,
  createActivistCodes: createActivistCodes
};
