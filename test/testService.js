function VanResponseHandlerMock() {}

VanResponseHandlerMock.prototype.handle =
  function(vanEndpoint, apiKey, dbMode, id,
      unauthorized, badRequest, success) {

    if (this.forceSuccess) {
      success(this.successData);
    } else if (this.forceUnauthorized) {
      unauthorized({});
    } else if (this.forceNotFound) {
      success({});
    } else {
      badRequest({});
    }
  };

module.exports = {
  VanResponseHandlerMock: VanResponseHandlerMock
};
