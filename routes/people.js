var contentType = require('../middleware/contentType'),
    ngpvanAPIClient = require('../lib/ngpvan-api-client'),
    BPromise = require('bluebird'),
    osdi = require('../lib/osdi'),
    config = require('../config'),
    auth = require('basic-auth'),
    bridge = require('../lib/bridge'),
    _ = require('lodash');

var vanEndpoint = config.get('vanEndpoint');

function translateToMatchCandidate(req) {
  var osdiPerson = {};

  if (req && req.body && req.body.person) {
    osdiPerson = req.body.person;
  }
  var answer = {
    firstName: osdiPerson.given_name,
    middleName: osdiPerson.additional_name,
    lastName: osdiPerson.family_name,
  };

  if (osdiPerson.email_addresses && osdiPerson.email_addresses[0]) {
    answer.email = {};
    answer.email.email = osdiPerson.email_addresses[0].address;
    var isPreferred = false;

    if (osdiPerson.email_addresses[0].primary) {
      isPreferred = true;
    }

    answer.email.isPreferred = isPreferred;
  }

  if (osdiPerson.phone_numbers && osdiPerson.phone_numbers[0]) {
    var typeMapping = {
      'Home': 'H',
      'Work': 'W',
      'Mobile': 'M',
      'Fax': 'F'
    };

    answer.phone = {};
    answer.phone.phoneNumber = osdiPerson.phone_numbers[0].number;
    answer.phone.ext = osdiPerson.phone_numbers[0].extension;
    answer.phone.isPreferred =
      osdiPerson.phone_numbers[0].primary ? true : false;

    var osdiNumberType = typeMapping[osdiPerson.phone_numbers[0].number_type];
    answer.phone.phoneType  = osdiNumberType ? osdiNumberType : null;
  }

  if (osdiPerson.postal_addresses && osdiPerson.postal_addresses[0]) {
    var osdiAddress = osdiPerson.postal_addresses[0];
    var addressTypeMapping = {
      'Home': 'H',
      'Work': 'W',
      'Mailing': 'M'
    };

    answer.address = {};

    if (osdiAddress.address_lines) {
      answer.address.addressLine1 = osdiAddress.address_lines[0];
      answer.address.addressLine2 = osdiAddress.address_lines[1];
      answer.address.addressLine3 = osdiAddress.address_lines[2];
    }

    answer.address.city = osdiAddress.locality;
    answer.address.stateOrProvince = osdiAddress.region;
    answer.address.zipOrPostalCode = osdiAddress.postal_code;
    answer.address.countryCode = osdiAddress.country;

    var osdiAddressType = addressTypeMapping[osdiAddress.address_type];
    answer.address.address_type = osdiAddressType ? osdiAddressType : null;
    answer.address.isPreferred = osdiAddress.primary ? true : false;
  }

  // intentionally ignoring identifiers for now - bit tricky semantically

  return answer;
}

function translateToActivistCodes(req) {
  var answer = [];

  if (req && req.body && req.body.add_tags) {
    answer = req.body.add_tags;
  }

  return answer;
}

function translateToScriptResponse(req) {
  var answer = [];

  if (req && req.body && req.body.add_tags) {
    answer = _.map(req.body.add_answers, function(survey_answer) {
      var re = /api\/v1\/questions\/(.*)$/i;
      var questionId = survey_answer.question.match(re)[1];

      return {
        surveyQuestionId: questionId,
        surveyResponseId: survey_answer.responses[0]
      };
    });
  }

  return answer;

}

function translateToOSDIPerson(vanPerson) {
  var answer = {
    identifiers: [
      'VAN:' + vanPerson.vanId
    ],
    given_name: vanPerson.firstName,
    family_name: vanPerson.lastName,
    additional_name: vanPerson.middleName,
    _links: {
      self: {
        href: config.get('apiEndpoint') + 'people/' + vanPerson.vanId
      },
      "osdi:record_canvass_helper": {
        href: config.get('apiEndpoint') + 'people/' + vanPerson.vanId + '/record_canvass_helper'
      }
    }
  };

  var addressTypes = [ 'Home', 'Work', 'Mailing' ];

  answer.postal_addresses = _.map(vanPerson.addresses, function(address) {
    return {
      primary: address.isPreferred ? true : false,
      address_lines: [
        address.addressLine1,
        address.addressLine2,
        address.addressLine3
      ],
      locality: address.city,
      region: address.stateOrProvince,
      postal_code: address.zipOrPostalCode,
      country: address.countryCode,
      address_type: _.indexOf(address.type, addressTypes) >= 0 ?
        address.type : null
    };
  });

  answer.email_addresses = _.map(vanPerson.emails, function(email) {
    return {
      primary: email.isPreferred ? true: false,
      address: email.email,
    };
  });

  var phoneTypes = [ 'Home', 'Work', 'Cell', 'Mobile', 'Fax' ];

  answer.phone_numbers = _.map(vanPerson.phones, function(phone) {
    return {
      primary: phone.isPreferred ? true : false,
      number: phone.phoneNumber,
      extension: phone.ext,
      number_type: _.indexOf(phone.phoneType, phoneTypes) >= 0 ?
        phone.phoneType : null

    };
  });

  return answer;
}

function signup(req, res) {
  var vanClient = bridge.createClient(req);

  var matchCandidate = translateToMatchCandidate(req);
  var activistCodeIds = translateToActivistCodes(req);
  var originalMatchResponse = null;

  var personPromise = vanClient.people.findOrCreate(matchCandidate).
    then(function(matchResponse) {
      originalMatchResponse = matchResponse;
      var vanId = matchResponse.vanId;
      return vanClient.people.applyActivistCodes(vanId, activistCodeIds);
    }).
    then(function() {
      var expand = ['phones', 'emails', 'addresses'];
      return vanClient.people.getOne(originalMatchResponse.vanId, expand);
    });

  bridge.sendSingleResourceResponse(personPromise, translateToOSDIPerson,
    'people', res);
}

function getOne(req, res) {
  var vanClient = bridge.createClient(req);

  var vanId = 0;
  if (req && req.params && req.params.id) {
    vanId = req.params.id;
  }

  var expand = ['phones', 'emails', 'addresses'];
  var personPromise = vanClient.people.getOne(vanId, expand);

  bridge.sendSingleResourceResponse(personPromise, translateToOSDIPerson,
    'people', res);
}


function canvass(req, res) {
  var vanClient = bridge.createClient(req);

  var vanId = 0;
  if (req && req.params && req.params.id) {
    vanId = req.params.id;
  }

  var canvassPromise;

  var canvass = req.body.canvass;
  if (canvass.status_code) {
    canvassPromise = vanClient.people.postNonCanvass(vanId, canvass.status_code,
      canvass.contact_type, canvass.action_date);
  }

  else {
    var activistCodeIds = translateToActivistCodes(req);
    var surveyResponses = translateToScriptResponse(req);

    var canvassResponses = _.union(
      _.map(activistCodeIds, function(id) {
        return {
          'activistCodeId': id,
          'action': 'Apply',
          'type': 'ActivistCode'
        };
      }),
      _.map(surveyResponses, function(surveyResponse) {
        var answer = surveyResponse;
        answer.type = 'SurveyResponse';
        return answer;
      })
    );

    canvassPromise = vanClient.people.postCanvassResponses(vanId,
      canvassResponses, canvass.contact_type, canvass.action_date);
  }

  function translateToOSDICanvass() {
    var canvass = req.body.canvass;
    var answer = canvass;
    answer.identifiers = [ 'VAN:' + vanId ];
    answer._links = {
      'osdi:target': {
        href: config.get('apiEndpoint') + 'people/' + vanId
      }
    };

    return answer;
  }

  bridge.sendSingleResourceResponse(canvassPromise, translateToOSDICanvass,
    'people', res);
}


module.exports = function (app) {
  app.get('/api/v1/people/:id', contentType, getOne);
  app.post('/api/v1/people/person_signup_helper', contentType, signup);
  app.post('/api/v1/people/:id/record_canvass_helper', contentType, canvass);
};
