var contentType = require('../middleware/contentType'),
    osdi = require('../lib/osdi'),
    bridge = require('../lib/bridge');

function getAll(req, res) {
  var vanClient = bridge.createClient(req);
  var vanPaginationParams = bridge.getVANPaginationParams(req);
  
  var resourcePromise = vanClient.activistCodes.getMany(null, null, null,
    vanPaginationParams.top, vanPaginationParams.skip);

  bridge.sendMultiResourceResponse(resourcePromise, vanPaginationParams, 
    oneResourceTranslator, 'tags', res);
}

function getOne(req, res) {
  var vanClient = bridge.createClient(req);
  
  var id = 0;
  if (req && req.params && req.params.id) {
    id = req.params.id;
  }

  var resourcePromise = vanClient.activistCodes.getOne(id);
  
  bridge.sendSingleResourceResponse(resourcePromise, oneResourceTranslator,
    'tags', res);
}

function oneResourceTranslator(ac) {
    var answer = osdi.response.createCommonItem(
      ac.name,
      ac.description);

  osdi.response.addIdentifier(answer, 'VAN:' + ac.activistCodeId);
  osdi.response.addSelfLink(answer, 'tags', ac.activistCodeId);
  return answer;
}

module.exports = function (app) {
  app.get('/api/v1/tags', contentType, getAll);
  app.get('/api/v1/tags/:id', contentType, getOne);
};
