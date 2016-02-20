/*jslint nodejs: true*/

var express = require('express'),
    iefix = require('express-ie-cors'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    routes = require('./routes'),
    config = require('./config'),
    notSupported = require('./middleware/notSupported'),
    contentType = require('./middleware/contentType'),
    halParser = require('./middleware/halParser'),
    requireHttps = require('./middleware/requireHttps'),
    soap= require('soap'),
    app = module.exports = express();

app.use(iefix({ contentType: 'application/x-www-form-urlencoded' }));
app.use(bodyParser.text({ 'type': 'application/hal+json' }));
app.use(halParser);
app.use(requireHttps);
app.use(cors());
app.use(contentType);

var key;
for (key in routes) {
  if (routes.hasOwnProperty(key)) {
    routes[key](app);
  }
}

app.all('/api/v1/*', function (req, res) {
  return notSupported.send(req, res);
});

app.all('/*', function (req, res) {
  res.sendStatus(404);
});

if (!module.parent) {
  var port = config.get('port');

  app.listen(port, function() {
    console.log('Listening on %d.', port);
  });
}
