
# NGP VAN API Client

This library is a nodejs client for the NGP VAN API.  It returns bluebird-style promises via http-as-promised.

## Usage


````
var client = require('./lib/ngpvan-api-client');
client.van('https://api.securevan.com/v4', 'your-api-key', 1).activistCodes.getMany(null, null, null, 5, 10).
spread(function(response) {
  console.log(response.body);
}).
catch(client.errors.Forbidden, function(ex) { console.log('access denied'); }).
catch(client.errors.NotFound, function(ex) { console.log('not found'); }).
catch(client.errors.Unexpected, function (ex) { console.log('unexpected error:', ex.referenceCode); }).

var matchCandidate = {'firstName': 'Zoe', 'lastName': 'Bartlett', 'email': { 'email': 'zb@fake.ngpvan.com' } };
client.van('https://api.securevan.com/v4', 'your-api-key', 1).people.findOrCreate(matchCandidate).
spread(function (response) {
  console.log('VANID:', JSON.parse(response.body).vanId);
}).
catch(client.errors.Forbidden, function(ex) { console.log('access denied'); }).
catch(client.errors.NotFound, function(ex) { console.log('not found'); }).
catch(client.errors.Unexpected, function (ex) { console.log('unexpected error:', ex.referenceCode); }).
````