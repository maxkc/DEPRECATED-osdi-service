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
  addLink: addLink,
  addIdentifier: addIdentifier
}
