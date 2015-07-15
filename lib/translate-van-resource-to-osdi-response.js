
var client = require('./ngpvan-api-client'),
    osdi = require('./osdi');

module.exports = function(resourcePromise, resourceTranslator, resourceType, res) {
	
  resourcePromise.
    then(function(vanResource) {
  	  var osdiResource = resourceTranslator(vanResource);
      return res.status(200).send(osdiResource);
    }).
    catch(client.errors.Forbidden, function(ex) { return osdi.response.unauthorized(res); }).
    catch(client.errors.NotFound, function(ex) { return osdi.response.badRequest(res, resourceType)(ex); }).
    catch(client.errors.Unexpected, function (ex) { return osdi.response.badRequest(res, resourceType)(ex); });
    
};
