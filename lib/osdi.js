var config = require('../config');

var root = config.get('apiEndpoint');
var vanEndpoint = config.get('vanEndpoint');

function createCommonItem(name, description) {
  var embedded = {
    'origin_system': 'VAN',
    'name': name,
    'description': description
  };

  return embedded;
}

function createPaginatedItem(page, perPage, totalPages, totalRecords, path) {
    var answer = {
      "total_pages": totalPages,
      "per_page": perPage,
      "page": page,
      "total_records": totalRecords
    };

    if (page < totalPages) {
      var nextPath = path + '?page=' + (page + 1) + '&per_page' + perPage;
      addLink(answer, 'next', nextPath);
    }
    if (page > 1) {
      var previousPath = path + '?page=' + (page - 1) + '&per_page' + perPage;
      addLink(answer, 'previous', previousPath)
    }
    return answer;
}

function addEmbeddedItems(paginated, items, formatter) {
  paginated._embedded = items.map(formatter);
}

function addLink(item, name, path) {
  item._links = item._links || {};
  item._links[name] = {
    href: root + path
  }
}

function addIdentifier(item, identifier) {
  item.identifiers = item.identifiers || [];
  item.identifiers.push(identifier);
}

module.exports = {
  createCommonItem: createCommonItem,
  createPaginatedItem: createPaginatedItem,
  addEmbeddedItems: addEmbeddedItems,
  addLink: addLink,
  addIdentifier: addIdentifier
}
