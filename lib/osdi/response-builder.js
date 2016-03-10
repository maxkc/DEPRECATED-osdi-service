var config = require('../../config');

var root = config.get('apiEndpoint');
var _ = require('lodash');

function createCommonItem(name, description) {
  var embedded = {
    'origin_system': 'VAN',
    'name': name,
    'description': description
  };

  return embedded;
}

function createPaginatedItem(page, perPage, totalPages, totalRecords, path) {
  var paginated = {
    'total_pages': totalPages,
    'per_page': perPage,
    'page': page,
    'total_records': totalRecords
  };

  if (typeof page !== 'undefined' && page < 0) {
    throw new Error('page must be a non-negative integer');
  }

  if (page < totalPages) {
    var nextPath = path + '?page=' + (page + 1) + '&per_page=' + perPage;
    addLink(paginated, 'next', nextPath);
  }
  if (page > 1) {
    var previousPath = path + '?page=' + (page - 1) + '&per_page=' + perPage;
    addLink(paginated, 'previous', previousPath);
  }

  return paginated;
}

function addEmbeddedItems(paginated, items, formatter, resourceType) {
  if (resourceType) {
    var key = ("osdi:" + resourceType);
    paginated._embedded = {};
    paginated._embedded[key] = items.map(formatter);

  } else {
    paginated._embedded = items.map(formatter);
  }


}

function addLink(item, name, path) {
  item._links = item._links || {};
  item._links[name] = {
    href: root + path
  };
}

function addSelfLink(item, type, id) {
  addLink(item, 'self', type + '/' + id);
}

function addIdentifier(item, identifier) {
  item.identifiers = item.identifiers || [];
  item.identifiers.push(identifier);
}

function addCurie(item, template) {
  item._links = item._links || {};
  item._links.curies = [
    {
      name: 'osdi',
      'href': template,
      'templated': true
    }
  ];
}

function unauthorized(res) {
  return function () {
    return res.status(401).end();
  };
}

function badRequest(res, type) {
  return function (errors) {
    var response_code = 400;

    var answer = {
      'request_type': 'atomic',
      'response_code': response_code,
      'resource_status': [
        {
          'resource': 'osdi:' + type,
          'response_code': response_code,
          'errors': errors
        }
      ]
    };

    return res.status(response_code).send(answer);
  };
}

function notFound(res) {
  return function () {
    return res.status(404).end();
  };
}

function unexpected(res, type) {
  return function (referenceCode) {
    var response_code = 500;

    var answer = {
      'request_type': 'atomic',
      'response_code': response_code,
      'resource_status': [
        {
          'resource': 'osdi:' + type,
          'response_code': response_code,
          'errors': [
            {
              'error_code': 'UNEXPECTED_ERROR',
              'description': 'An unexpected error has occurred',
              'properties': [],
              'reference_code': referenceCode
            }
          ]
        }
      ]
    };

    return res.status(response_code).send(answer);
  };
}

function valueOrBlank(value) {
  var answer = value;

  if (!value) {
    answer = '';
  }

  return answer;
}

function vanAddressToOSDI(address) {
  var addressTypes = [ 'Home', 'Work', 'Mailing' ];

  var address_lines = [];
  if (address.addressLine1) {
    address_lines.push(address.addressLine1);
  }

  if (address.addressLine2) {
    address_lines.push(address.addressLine2);
  }

  if (address.addressLine3) {
    address_lines.push(address.addressLine3);
  }


  return {
    primary: address.isPreferred ? true : false,
    address_lines: address_lines,
    locality: address.city,
    region: address.stateOrProvince,
    postal_code: address.zipOrPostalCode,
    country: address.countryCode,
    address_type: _.indexOf(address.type, addressTypes) >= 0 ?
      address.type : ''
  };
}

function vanLocationToOSDI(vanLocation) {
  var location = vanAddressToOSDI(vanLocation.address);

  location.venue=vanLocation.name;
  location.description=vanLocation.displayName;
  location.location_id=vanLocation.locationId;

  return location;
}

module.exports = {
  createCommonItem: createCommonItem,
  createPaginatedItem: createPaginatedItem,
  addEmbeddedItems: addEmbeddedItems,
  addLink: addLink,
  addSelfLink: addSelfLink,
  addIdentifier: addIdentifier,
  addCurie: addCurie,
  unauthorized: unauthorized,
  badRequest: badRequest,
  notFound: notFound,
  unexpected: unexpected,
  vanAddressToOSDI: vanAddressToOSDI,
  vanLocationToOSDI: vanLocationToOSDI
};
