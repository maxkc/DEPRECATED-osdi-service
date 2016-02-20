var soap= require('soap');
var config = require('../config'),
  osdi = require('../lib/osdi'),
  bridge = require('../lib/bridge');


function getCredentials(apiToken) {
  if (typeof apiToken !== 'string') {
    return {};
  }

  var parts = apiToken.split('|');
  return { apiKey: parts[0], dbMode: parts[1] };
}

function getScript(req, res) {

  var apiToken = osdi.request.getAPIToken(req);
  var credentials = getCredentials(apiToken);

  var id = 0;
  if (req && req.params && req.params.id) {
    id = req.params.id;
  }

  var dbMode = (credentials.dbMode == "1") ? 'MyCampaign' : 'MyVoters';

  var url = 'https://api.securevan.com/services/v3/ScriptService.asmx?WSDL';
  var args = {
    'ScriptID' : id,
    'options' : {
      'ReturnSections' : 'ScriptElement'
    }
  };
  soap.createClient(url, function(err, client) {
    client.addSoapHeader({'Header' : {
      'APIKey' : credentials.apiKey,
        //'32392763-4335-446C-BDD7-298D10A5E3BE',
      'DatabaseMode' : dbMode
    }},'','myvan','https://api.securevan.com/Services/V3/');
    client.GetScript(args, function(err, result) {

      if (err) {
       res.send(result.body);
      } else {
        res.send(result.GetScriptResult);
        console.log(client.lastRequest);
        console.log(result.body);
      }
    });
  });

}


function listScripts(req, res) {
  var apiToken = osdi.request.getAPIToken(req);
  var credentials = getCredentials(apiToken);

  var id = 0;
  if (req && req.params && req.params.id) {
    id = req.params.id;
  }

  var dbMode = (credentials.dbMode == "1") ? 'MyCampaign' : 'MyVoters';

  var url = 'https://api.securevan.com/services/v3/ScriptService.asmx?WSDL';
  var args = {
    'criteria' : {
      'Status' : 'Active',
      'DatabaseMode' : 'BothModes'
    }
    /* foo  */
  };
  soap.createClient(url, function(err, client) {
    client.addSoapHeader({'Header' : {
      'APIKey' : credentials.apiKey,
      'DatabaseMode' : dbMode
    }},'','myvan','https://api.securevan.com/Services/V3/');
    client.ListScripts(args, function(err, result) {

      if (err) {
        res.send(result.body);
      } else {
        res.send(result.ListScriptsResult.Scripts.Script);
        console.log(client.lastRequest);
        //console.log(err.statusCode);
      }
    });
  });

}

module.exports = function (app) {
  app.get('/api/osdisoap/scripts', listScripts);
  app.get('/api/osdisoap/scripts/:id', getScript);

};
