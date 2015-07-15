var contentType = require('../middleware/contentType'),
    ngpvanAPIClient = require('../lib/ngpvan-api-client'),
    osdi = require('../lib/osdi'),
    osdiVANClientFactory = require('../lib/osdi-van-client-factory'),
    vanRequest = require('../lib/van-request-helper'),
    translateVANResourceToOSDIResponse = require('../lib/translate-van-resource-to-osdi-response');

function getAll(req, res) {
  var vanClient = osdiVANClientFactory(req);
  var pagination = osdi.request.getPaginationOptions(req);
  
  var top = null;
  var skip = null;
  if (pagination.page && pagination.perPage) {
    top = pagination.perPage;
    skip = (pagination.page - 1) * pagination.perPage;
  }
  else if (pagination.perPage) {
    top = pagination.perPage;
  }  
  
  var resourceType = 'tags';

  var manyResourcesTranslator = function (acs) {
    var totalRecords = acs.count;

    var totalPages = Math.ceil(totalRecords / pagination.perPage);
    var answer = osdi.response.createPaginatedItem(pagination.page, pagination.perPage, 
      totalPages, totalRecords, resourceType);
  
    var items = acs.items;
  
    osdi.response.addEmbeddedItems(answer, items, oneResourceTranslator);
    return answer;
  };
  
  var resourcePromise = vanClient.activistCodes.getMany(null, null, null, top, skip);
  translateVANResourceToOSDIResponse(resourcePromise, manyResourcesTranslator, resourceType, res);
}

function getOne(req, res) {
  var vanClient = osdiVANClientFactory(req);
  
  var id = 0;
  if (req && req.params && req.params.id) {
    id = req.params.id;
  }

  var resourcePromise = vanClient.activistCodes.getOne(id);
  translateVANResourceToOSDIResponse(resourcePromise, oneResourceTranslator, 'tags', res);
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
