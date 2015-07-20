var contentType = require('../middleware/contentType'),
    ngpvanAPIClient = require('../lib/ngpvan-api-client'),
    BPromise = require('bluebird'),
    osdi = require('../lib/osdi'),
    config = require('../config'),
    auth = require('basic-auth');

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
    answer.email.address_type = 'Personal';
  }
  
  if (osdiPerson.phone_numbers && osdiPerson.phone_numbers[0]) {
    var typeMapping = {
      'Home': 'H',
      'Work': 'W',
      'Mobile': 'M',
      'Fax': 'F'
    };
    
    answer.phone = {};
    answer.phone.phonueNumber = osdiPerson.phone_numbers[0].number;
    answer.phone.ext = osdiPerson.phone_numbers[0].extension;
    answer.phone.isPreferred =
      osdiPerson.phone_numbers[0].primary ? true : false;
      
    var osdiNumberType = typeMapping[osdiPerson.phone_numbers[0].number_type];
    answer.phone.phoneType  = numberType ? numberType : null;
  }
  
  if (osdiPerson.postal_addresses && osdiPerson.postal_addresses[0]) {
    var osdiAddress = osdiPerson.postal_addresses[0];
    var addressTypeMapping = {
      'Home': 'H',
      'Work': 'W',
      'Mailing': 'M'
    };
    
    answer.address = {};
    answer.address.addressLine1 = osdiAddress.address_lines[0];
    answer.address.addressLine2 = osdiAddress.address_lines[1];
    answer.address.addressLine3 = osdiAddress.address_lines[2];
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
    answer = _(req.body.add_tags);
  }
  
  return answer;
}

function translateToOSDIPerson(vanPerson) {
  return {};
}

function signup(req, res) {
  var vanClient = bridge.createClient(req);

  var matchCandidate = translateToMatchCandidate(req);
  var acs = translateToActivistCodes(req);
  var originalMatchResponse = null;
  
  var personPromise = vanClient.people.findOrCreate(matchCandidate).
    then(function(matchResponse) {
      originalMatchResponse = matchResponse;
      var vanId = matchRepsonse.vanId;
      
      var promises = _.map(acs, function (activistCodeId) {
        return vanClient.people.applyActivistCode(vanId, activistCodeId);
      });
      
      return BPromise.all(promises);
    }).
    then(function() {
      return vanClient.people.getOne(originalMatchRsponse.vanId);
    });
  
  bridge.sendSingleResourceResponse(personPromise, translateToOSDIPerson,
    'people', res);
}


module.exports = function (app) {
  app.post('/api/v1/people/person_signup_helper', contentType, signup);
};
