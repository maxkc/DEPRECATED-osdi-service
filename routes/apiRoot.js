
var notSupported = require('../middleware/notSupported'),
    contentType = require('../middleware/contentType');

function apiRoot(req, res) {
  var answer = {
    motd: 'Welcome to the NGP VAN OSDI Service!',
    max_pagesize: 200,
    vendor_name: 'NGP VAN, Inc.',
    product_name: 'VAN',
    osdi_version: '1.0',
    _links: {
      self: {
        href: 'http://ngpvan-osdi-service.herokuapp.com/api/v1/',
        title: 'NGP VAN OSDI Service Entry Point'
      }
    }
  };

  return res.status(200).send(answer);
}


module.exports = function (app) {
  app.get('/api/v1/', contentType, apiRoot);
};


