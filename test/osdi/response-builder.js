/*global describe, it, beforeEach */

var osdi = require('../../lib/osdi').response;
var root = require('../../config').get('apiEndpoint');
var sinon = require('sinon');
require('should');

describe('osdi.response-helper', function() {
  describe('#createCommonItem', function() {
    it('creates object with required properties', function() {
      var name = 'Item';
      var desc = 'It is an item';

      var item = osdi.createCommonItem(name, desc);

      item.origin_system.should.equal('VAN');
      item.name.should.equal(name);
      item.description.should.equal(desc);
    });
  });

  describe('#createPaginatedItem', function() {
    var page, perPage = 2, pages = 4, total = 8;
    var path = 'tags';
    var createItem = function() {
      return osdi.createPaginatedItem(page, perPage, pages, total, path);
    };

    it('throws an error if page < 0', function() {
      page = -1;

      var act = function() { createItem(); };
      act.should.throwError();
    });

    it('creates object with required properties', function() {
      page = 1;

      var item = createItem();

      item.page.should.equal(page);
      item.per_page.should.equal(perPage);
      item.total_pages.should.equal(pages);
      item.total_records.should.equal(total);
    });

    it('adds a next link when there are more pages', function() {
      page = 1;

      var item = createItem();

      var expectedPath = 'tags?page=' + (page + 1) + '&per_page=' + perPage;
      item._links.next.href.should.equal(root + expectedPath);
    });

    it('adds a previous link when there are previous pages', function() {
      page = pages;

      var item = createItem();

      var expectedPath = 'tags?page=' + (page - 1) + '&per_page=' + perPage;
      item._links.previous.href.should.equal(root + expectedPath);
    });

    it('adds next and previous links when on a middle page', function() {
      page = 3;

      var item = createItem();

      var previousPath = 'tags?page=' + (page - 1) + '&per_page=' + perPage;
      var nextPath = 'tags?page=' + (page + 1) + '&per_page=' + perPage;
      item._links.previous.href.should.equal(root + previousPath);
      item._links.next.href.should.equal(root + nextPath);
    });
  });

  describe('#addEmbeddedItems', function() {
    it('adds formatted embedded items', function() {
      var item = {};
      var items = [1, 4, 9];
      var formatter = Math.sqrt;

      osdi.addEmbeddedItems(item, items, formatter);

      var expected = items.map(formatter);

      item._embedded.should.eql(expected);
    });
  });

  describe('#addLink', function() {
    it('adds a link to an item', function() {
      var item = {};
      var name = 'self', value = 'items';

      osdi.addLink(item, name, value);

      item._links[name].href.should.equal(root + value);
    });

    it('preserves existing links', function() {
      var item = {
        _links: {
          'existing': { href: 'localhost' }
        }
      };
      var name = 'self', value = 'items';

      osdi.addLink(item, name, value);

      item._links.existing.href.should.equal('localhost');
      item._links[name].href.should.equal(root + value);
    });
  });

  describe('#addSelfLink', function() {
    it('adds a self link to an item', function() {
      var item = {};
      var type = 'items';
      var id = 123;

      osdi.addSelfLink(item, type, id);

      item._links.self.href.should.equal(root + type + '/' + id);
    });

    it('preserves existing links', function() {
      var item = {
        _links: {
          'existing': { href: 'localhost' }
        }
      };
      var type = 'items';
      var id = 123;

      osdi.addSelfLink(item, type, id);

      item._links.existing.href.should.equal('localhost');
      item._links.self.href.should.equal(root + type + '/' + id);
    });
  });

  describe('#addIdentifier', function() {
    it('adds an identifier to an item', function() {
      var item = {};
      var id = 'VAN:1234';

      osdi.addIdentifier(item, id);

      item.identifiers[0].should.equal(id);
    });

    it('preserves existing identifiers', function() {
      var item = {
        identifiers: ['VAN:4321']
      };
      var id = 'VAN:1234';

      osdi.addIdentifier(item, id);

      item.identifiers[0].should.equal('VAN:4321');
      item.identifiers[1].should.equal(id);
    });
  });

  describe('#getPaginationOptions', function() {
    it('extracts page from querystring', function() {
      var req = {
        query: {
          page: '123'
        }
      };

      var pagination = osdi.getPaginationOptions(req);

      pagination.page.should.equal(123);
    });

    it('extracts per_page from querystring', function() {
      var req = {
        query: {
          per_page: '456'
        }
      };

      var pagination = osdi.getPaginationOptions(req);

      pagination.perPage.should.equal(456);
    });

    it('returns empty object if no pagination options sent', function() {
      var pagination = osdi.getPaginationOptions({});

      pagination.should.eql({});
    });

    it('returns perPage 50 if page specified without perPage', function() {
      var req = {
        query: {
          page: '1'
        }
      };

      var pagination = osdi.getPaginationOptions(req);

      pagination.perPage.should.equal(50);
    });
  });

  describe('#unauthorized', function() {
    it('returns a function that sends 401 when called', function() {
      var res = {
        status: function() { return res; },
        end: function() {}
      };

      sinon.spy(res, 'status');
      sinon.spy(res, 'end');

      osdi.unauthorized(res)();
      res.status.calledOnce.should.be.true();
      res.status.calledWith(401).should.be.true();
      res.end.calledOnce.should.be.true();
    });
  });

  describe('#badRequest', function() {
    var res;
    beforeEach(function() {
      res = {
        status: function() { return res; },
        send: function() {}
      };
      sinon.spy(res, 'status');
      sinon.spy(res, 'send');
    });
    it('returns a function that sends 400 if called without err', function() {
      osdi.badRequest(res, 'items')();
      res.status.calledOnce.should.be.true();
      res.status.calledWith(400).should.be.true();
      res.send.calledOnce.should.be.true();
    });

    it('returns a function that sends 500 if called without err', function() {
      osdi.badRequest(res, 'items')({});
      res.status.calledOnce.should.be.true();
      res.status.calledWith(500).should.be.true();
      res.send.calledOnce.should.be.true();
    });

    it('returns a function that sends formatted error', function() {
      var expected = {
        'request_type': 'atomic',
        'response_code': 400,
        'resource_status': [
          {
            'resource': 'osdi:items',
            'response_code': 400,
            'errors': [
              {
                'code': 'UNKNOWN',
                'description': 'Translating VAN errors is not yet supported.'
              }
            ]
          }
        ]
      };
      osdi.badRequest(res, 'items')();
      res.send.calledWith(expected).should.be.true();
      res.send.calledOnce.should.be.true();
    });

  });
});
