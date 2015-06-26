var osdi = require('../lib/osdi');
var root = require('../config').get('apiEndpoint');

describe('osdi', function() {
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
    }

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
      item._links['next'].href.should.equal(root + expectedPath)
    });

    it('adds a previous link when there are previous pages', function() {
      page = pages;

      var item = createItem();

      var expectedPath = 'tags?page=' + (page - 1) + '&per_page=' + perPage;
      item._links['previous'].href.should.equal(root + expectedPath)
    });

    it('adds next and previous links when on a middle page', function() {
      page = 3;

      var item = createItem();

      var expectedPreviousPath = 'tags?page=' + (page - 1) + '&per_page=' + perPage;
      var expectedNextPath = 'tags?page=' + (page + 1) + '&per_page=' + perPage;
      item._links['previous'].href.should.equal(root + expectedPreviousPath)
      item._links['next'].href.should.equal(root + expectedNextPath)
    });
  });

  describe('#addEmbeddedItems', function() {
    it('adds formatted embedded items', function() {
      var item = {};
      var items = [1, 4, 9];
      var formatter = Math.sqrt;

      var result = osdi.addEmbeddedItems(item, items, formatter);

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

      item._links['existing'].href.should.equal('localhost');
      item._links[name].href.should.equal(root + value);
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
    })
  });
});
