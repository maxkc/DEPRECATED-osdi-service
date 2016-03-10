var config = require('../config'),
    osdi = require('../lib/osdi'),
    _ = require('lodash'),
    bridge = require('../lib/bridge'),
    selectn = require('selectn');

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

function getAttendances(req,res) {
  var rawBody = req.body;

  var vanClient = bridge.createClient(req);

  var id = 0;
  if (req && req.params && req.params.id) {
    id = req.params.id;
  }

  var event_id = parseInt(id);
  var vanPaginationParams = bridge.getVANPaginationParams(req);


  var resourcePromise = vanClient.events.getAttendances(id);

  bridge.sendMultiResourceResponse(resourcePromise, vanPaginationParams,
    oneAttendanceTranslator, 'attendances', res);
}

function oneAttendanceTranslator(vanitem) {
  var answer = osdi.response.createCommonItem(
    "Attendance",
    "");

  var statuses= {
    'Scheduled' : 'accepted',
    'Confirmed' : 'accepted'
  };

  answer['van:signup'] = {
    shift_id: selectn('shift.EventShiftId', vanitem),
    shift_name: selectn('shift.name',vanitem),
    role_id: selectn('role.roleId',vanitem),
    role_name: selectn('role.name',vanitem),
    location_id: selectn('location.locationId',vanitem),
    location_venue: selectn('location.name',vanitem),
    location_description: selectn('location.displayName',vanitem),
    status_id: selectn('status.statusId',vanitem),
    status_name: selectn('status.name',vanitem),
    person_first_name: selectn('person.firstName',vanitem),
    person_last_name: selectn('person.lastName',vanitem),
    person_van_id: selectn('person.vanId',vanitem)
  };
  answer.status= statuses[selectn('status.name',vanitem)] || selectn('status.name',vanitem)

  osdi.response.addIdentifier(answer, 'VAN:' + vanitem.eventSignupId);
  osdi.response.addSelfLink(answer, 'events', vanitem.eventSignupId);
  osdi.response.addLink(answer,'osdi:person', 'people/' + vanitem.person.vanId);
  osdi.response.addCurie(answer, config.get('curieTemplate'));
  osdi.response.addEmbeddedItem(answer,vanitem.person,signupPersonTranslator,'person');
  answer.raw=vanitem;
  return answer;
}

function signupPersonTranslator(vanitem) {
   var answer = osdi.response.createCommonItem(
    "Person",
    "")

  answer.given_name=vanitem.firstName;
  answer.family_name=vanitem.lastName;
  answer.description=vanitem.firstName + ' ' + vanitem.lastName;
  osdi.response.addSelfLink(answer, 'people', vanitem.vanId);

  return answer;

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
  app.get('/api/v1/events/:id/attendances',getAttendances);
};
