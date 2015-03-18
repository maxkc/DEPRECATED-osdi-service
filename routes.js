
var notSupported = require('./middleware/notSupported');

function apiRoot(req, res) {
  return notSupported.send(req, res);
}


module.exports = function (app) {
  app.get('/api/v1/', apiRoot);
};


