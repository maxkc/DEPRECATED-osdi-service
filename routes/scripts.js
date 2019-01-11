var soap = require('soap');
var config = require('../config'),
  osdi = require('../lib/osdi'),
  _ = require('lodash'),
  bridge = require('../lib/bridge');

var xmlParseString = require('xml2js').parseString;
var selectn = require('selectn');


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

  var osdi_result;

  var sqid=null;
  if (req && req.params && req.params.sqid) {
    sqid = req.params.sqid;
  }

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
        'DatabaseMode': dbMode
      }
    }, '', 'myvan', 'https://api.securevan.com/Services/V3/');
    client.GetScript(args, function (err, result) {

      if (err) {
        handleSoapFault(result.statusCode, result.body, res,'script');

      } else {
        if ( sqid == null ) {
          osdi_result=scriptToOSDI(result.GetScriptResult);
        } else {
          osdi_result= singleScriptElementToOSDI(result.GetScriptResult,sqid);
        }

        res.send(osdi_result);
        if (config.get('node_env') == 'development') {
          console.log(client.lastRequest);
          console.log(result.GetScriptResult);
        }

      }
    });
  });

}

function handleSoapFault(responseCode, responseBody, res, resourceType) {

  xmlParseString(responseBody, function (err, result) {
    console.dir(JSON.stringify(result));

    var soapFaultCode = selectn('soap:Envelope.soap:Body[0].soap:Fault[0].faultcode[0]', result) || 'UNKNOWN';
    switch (soapFaultCode) {
      case 'VAN_ERROR_CODE_400':
        responseCode = 404;
        break;
      case 'VAN_ERROR_CODE_101':
      case 'VAN_ERROR_CODE_003':
        responseCode = 403;
        break;
      default:
        responseCode = 500;
    }

    var error_block = {
      'request_type': 'atomic',
      'response_code': responseCode,
      'resource_status': [
        {
          'resource': 'osdi:' + resourceType,
          'response_code': responseCode,
          'errors': [
            {
              'error_code': soapFaultCode,
              'description': selectn('soap:Envelope.soap:Body[0].soap:Fault[0].faultstring[0]', result)
            }
          ]
        }
      ]
    };
    res.status(responseCode);
    res.send(error_block);
  });


}
function scriptElementToOSDI(object) {
  var elem=object.element;
  var scriptId=object.scriptId;

  var ose = osdi.response.createCommonItem(
    elem.attributes['Name'],
    elem.ScriptQuestion
  );

  if (elem.attributes['SortOrder']) {
    ose.sequence = parseInt(elem.attributes['SortOrder']);
  }

  osdi.response.addEmbeddedItem(ose, elem, oneResourceTranslator, 'question');
  osdi.response.addSelfLink(ose,'scripts/' + scriptId + '/script_questions',elem.attributes['SortOrder']);
  osdi.response.addLink(ose, 'osdi:question','questions/' + elem.attributes['ID']);
  osdi.response.addLink(ose, 'osdi:script','scripts/' + scriptId);
  return ose;

}

function scriptToOSDI(script) {

  var elements=null;

  var oscript = osdi.response.createCommonItem(
    script.attributes['Name'],
    script.Description
  );
  oscript.title = script.attributes['Name'];
  oscript.summary = oscript.description;
  oscript.status = script.Status;
  osdi.response.addIdentifier(oscript, 'VAN:' + script.attributes['ID']);
  osdi.response.addSelfLink(oscript, 'scripts', script.attributes['ID']);

  if (elements=selectn('ScriptElements.ScriptElement',script))
    /* This is a bit awkward because we need to pass in the scriptId for the link in the script_question, but we can't control the argument list to the translator function passed into addEmbeddedItems so we create the intermediate object*/
    var objects= _.map(elements,function(element){
      return {
        scriptId: script.attributes['ID'],
        element: element
      }
    });
  osdi.response.addEmbeddedItems(oscript, objects, scriptElementToOSDI, 'script_questions');

  return oscript;
}

function singleScriptElementToOSDI(script,sqid) {
  var element=null;
  var oelement=null;

  if (element=selectn('ScriptElements.ScriptElement',script)[sqid]) {
    var object = {
      scriptId: script.attributes['ID'],
      element: element
    };
    oelement=scriptElementToOSDI(object);
  }

  return oelement;
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
      'DatabaseMode': dbMode //'BothModes'
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
    client["ListScripts"](args, function (err, result) {

      if (err) {
        handleSoapFault(result.statusCode, result.body, res,'script');
      } else {
        res.send(scriptCollectionToOSDI(result.ListScriptsResult.Scripts.Script));
        if (config.get('node_env') == 'development') {
          //console.log(client.lastRequest);
          //console.log(result.body);
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
  app.get('/api/v1/scripts/:id/script_questions/:sqid',getScript);

};
