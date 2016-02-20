var soap = require('soap');
var config = require('../config'),
  osdi = require('../lib/osdi'),
  bridge = require('../lib/bridge');


function getCredentials(apiToken) {
  if (typeof apiToken !== 'string') {
    return {};
  }

  var parts = apiToken.split('|');
  return {apiKey: parts[0], dbMode: parts[1]};
}

function getScript(req, res) {

  var apiToken = osdi.request.getAPIToken(req);
  var credentials = getCredentials(apiToken);

  var id = 0;
  if (req && req.params && req.params.id) {
    id = req.params.id;
  }

  var dbMode = (credentials.dbMode == "1") ? 'MyCampaign' : 'MyVoterFile';

  var url = 'https://api.securevan.com/services/v3/ScriptService.asmx?WSDL';
  var args = {
    'ScriptID': id,
    'options': {
      'ReturnSections': 'ScriptElement'
    }
  };
  soap.createClient(url, function (err, client) {
    client.addSoapHeader({
      'Header': {
        'APIKey': credentials.apiKey,
        //'32392763-4335-446C-BDD7-298D10A5E3BE',
        'DatabaseMode': dbMode
      }
    }, '', 'myvan', 'https://api.securevan.com/Services/V3/');
    client.GetScript(args, function (err, result) {

      if (err) {
        res.send(result.body);
      } else {
        res.send(scriptToOSDI(result.GetScriptResult));
        if (config.get('node_env') == 'development') {
          console.log(client.lastRequest);
          console.log(result.GetScriptResult);
        }

      }
    });
  });

}


function scriptElementToOSDI(elem) {
  var ose = osdi.response.createCommonItem(
    elem.attributes['Name'],
    elem.ScriptQuestion
  );

  ose.sequence = elem.sortOrder;
  osdi.response.addEmbeddedItems(ose, [elem], oneResourceTranslator, 'questions');

  return ose;
}

function scriptToOSDI(script) {

  var oscript = osdi.response.createCommonItem(
    script.attributes['Name'],
    script.Description
  );
  oscript.title = script.attributes['Name'];
  oscript.summary = oscript.description;
  oscript.status = script.Status;
  osdi.response.addIdentifier(oscript, 'VAN:' + script.attributes['ID']);
  osdi.response.addSelfLink(oscript, 'scripts', script.attributes['ID']);

  osdi.response.addEmbeddedItems(oscript, script.ScriptElements.ScriptElement, scriptElementToOSDI, 'script_questions');

  return oscript;
}


function oneResourceTranslator(sq) {
  var answer = osdi.response.createCommonItem(
    sq.MediumName,
    sq.ScriptQuestion);
  answer.title = sq.MediumName;
  answer.summary = answer.description;
  answer.question_type = 'SingleChoice';

  if (sq.SurveyQuestionResponses) {
    if (sq.SurveyQuestionResponses.SurveyQuestionResponse) {
      answer.responses = sq.SurveyQuestionResponses.SurveyQuestionResponse.map(
        function (response) {
          return {
            key: response.attributes['ID'],
            name: response.MediumName,
            title: response.attributes['Name']
          }
        }
      )
    }
  }

  osdi.response.addIdentifier(answer, 'VAN:' + sq.attributes['ID']);
  osdi.response.addSelfLink(answer, 'questions', sq.attributes['ID']);


  /*

   answer.responses = (sq.responses || []).map(function (response) {
   return {
   key: response.surveyResponseId,
   name: response.mediumName,
   title: response.name
   };
   });
   */
  osdi.response.addCurie(answer, config.get('curieTemplate'));

  return answer;
}

function listScripts(req, res) {
  var apiToken = osdi.request.getAPIToken(req);
  var credentials = getCredentials(apiToken);

  var id = 0;
  if (req && req.params && req.params.id) {
    id = req.params.id;
  }

  var dbMode = (credentials.dbMode == "1") ? 'MyCampaign' : 'MyVoterFile';

  var url = 'https://api.securevan.com/services/v3/ScriptService.asmx?WSDL';
  var args = {
    'criteria': {
      'Status': 'Active',
      'DatabaseMode': 'BothModes'
    }
    /* foo  */
  };
  soap.createClient(url, function (err, client) {
    client.addSoapHeader({
      'Header': {
        'APIKey': credentials.apiKey,
        'DatabaseMode': dbMode
      }
    }, '', 'myvan', 'https://api.securevan.com/Services/V3/');
    client.ListScripts(args, function (err, result) {

      if (err) {
        res.send(result.body);
      } else {
        res.send(scriptCollectionToOSDI(result.ListScriptsResult.Scripts.Script));
        if (config.get('node_env') == 'development') {
          console.log(client.lastRequest);
          console.log(result.body);
        }
      }
    });
  });

}


function scriptCollectionToOSDI(collection) {
  var root = config.get('apiEndpoint');
  res = {
    total_records: collection.length,
    per_page: collection.length

  };
  scripts = collection.map(function (item) {
    return scriptCollectionItemToOSDI(item);
  });
  links = scripts.map(function (script) {
    return script['_links']['self'];
  });

  res['_links'] = {
    'self': {
      'href': (root + 'scripts')
    }


  };

  if (scripts) {
    res['_embedded'] = {
      'osdi:scripts': scripts
    };
    res['_links']['osdi:scripts'] = links;

  }
  return res;
}

function scriptCollectionItemToOSDI(script) {

  var oscript = osdi.response.createCommonItem(
    script.attributes['Name'],
    script.Description
  );
  oscript.title = script.attributes['Name'];
  oscript.summary = oscript.description;
  oscript.status = script.Status;
  osdi.response.addIdentifier(oscript, 'VAN:' + script.attributes['ID']);
  osdi.response.addSelfLink(oscript, 'scripts', script.attributes['ID']);

  return oscript;
}

module.exports = function (app) {
  app.get('/api/v1/scripts', listScripts);
  app.get('/api/v1/scripts/:id', getScript);

};
