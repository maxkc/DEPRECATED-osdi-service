var config = require('../config'),
    osdi = require('../lib/osdi'),
    _ = require('lodash'),
    bridge = require('../lib/bridge');

function getAll(req, res) {
  var vanClient = bridge.createClient(req);
  var vanPaginationParams = bridge.getVANPaginationParams(req);
  var expand = ['locations', 'codes', 'shifts', 'roles', 'notes'];

  var resourcePromise = vanClient.events.getMany(expand, vanPaginationParams.top, vanPaginationParams.skip);

  bridge.sendMultiResourceResponse(resourcePromise, vanPaginationParams,
    oneResourceTranslator, 'events', res);
}

function getOne(req, res) {
  var vanClient = bridge.createClient(req);

  var id = 0;
  if (req && req.params && req.params.id) {
    id = req.params.id;
  }
  var expand = ['locations', 'codes', 'shifts', 'roles', 'notes'];
  var resourcePromise = vanClient.events.getOne(id, expand);

  bridge.sendSingleResourceResponse(resourcePromise, oneResourceTranslator,
    'events', res);
}


function recordAttendance(req,res) {
  var rawBody = req.body;

  var vanClient = bridge.createClient(req);

  var id = 0;
  if (req && req.params && req.params.id) {
    id = req.params.id;
  }

  var person_id = parseInt(rawBody.person.identifiers[0]);
  var event_id = parseInt(id);
  var signup={
    "person" : {
      "vanId" : person_id
    },
    "event" : {
      "eventId" : event_id
    }

  };

  console.dir(signup);


  var signupResponse={
    'status' : 'accepted',
    'event' : id,
    'person' : rawBody
  };

  vanClient.events.recordAttendance(signup).spread(function () {
    return res.send(signupResponse);

  })


}

function oneResourceTranslator(vanitem) {
  var answer = osdi.response.createCommonItem(
    vanitem.shortName,
    vanitem.description);
  answer.title = vanitem.name;
  answer.summary = answer.description;

  answer['van:event_type']=vanitem.eventType;
  answer.start_date=vanitem.startDate;
  answer.end_date=vanitem.endDate;
  answer.created_date=vanitem.createdDate;
  answer['van:shifts'] = _.map(vanitem.shifts, function(shift) {
    return {
      event_shift_id: shift.eventShiftId,
      name: shift.name,
      start_date: shift.startTime,
      end_time: shift.endTime
    }
  });

  if ((vanitem.locations) && (vanitem.locations.length >= 1) ) {
    answer.location = osdi.response.vanLocationToOSDI(vanitem.locations[0])
  }

  answer['van:locations'] = _.map(vanitem.locations, function(location) {
    return osdi.response.vanLocationToOSDI(location);
  });

  answer['van:roles'] = _.map(vanitem.roles, function(role) {
    return {
      role_id: role.roleId,
      name: role.name,
      is_event_lead: role.isEventLead,
      min: role.min,
      max: role.max,
      goal: role.goal
    }
  });
  answer['van:codes'] = _.map(vanitem.codes, function(code) {
    return {
      code_id: code.codeId,
      parent_code_id: code.parentCodeId,
      name: code.parentCodeId,
      code_path: code.codePath,
      created_by_name: code.createdByName,
      created_date: code.dateCreated,
      supported_entities: code.supportedEntities
    }
  });

  answer['van:voter_registration_batches'] = vanitem.voterRegistrationBatches;
  answer['van:districtFieldValue']=vanitem.districtFieldValue;

  osdi.response.addIdentifier(answer, 'VAN:' + vanitem.eventId);
  osdi.response.addSelfLink(answer, 'events', vanitem.eventId);
  osdi.response.addCurie(answer, config.get('curieTemplate'));

  return answer;
}

module.exports = function (app) {
  app.get('/api/v1/events', getAll);
  app.get('/api/v1/events/:id', getOne);
  app.post('/api/v1/events/:id/record_attendance_helper', recordAttendance);
};
