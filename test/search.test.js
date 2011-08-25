var Search = require('../lib/search.js');

// BindURL
exports['get user by id'] = function(test){
  test.deepEqual(
    '/users/123.json',
    Search.bindURL({ id: 123}, '/users/{id}.json')
  );  
  test.finish();
};

exports['get ticket by id'] = function(test){
  test.deepEqual(
    '/tickets/123',
    Search.bindURL({ id: 123}, '/tickets/{id}')
  );
  test.finish();
};

exports['get repo by user and id'] = function(test){
  test.deepEqual(
    '/repos/mixu/pixiedust',
    Search.bindURL({ user: 'mixu', id: 'pixiedust'}, '/repos/{user}/{id}')
  );
  test.finish();
};

// note that only one array param supported per expression!
exports['get two users repos'] = function(test){
  var items = Search.resolveItems({ user: [ 'mixu', 'test'], id: 'pixiedust'});
  test.equal(items.length, 2);
  test.deepEqual(
    '/repos/mixu/pixiedust',
    Search.bindURL(items[0], '/repos/{user}/{id}')
  );
  test.deepEqual(
      '/repos/test/pixiedust',
    Search.bindURL(items[1], '/repos/{user}/{id}')
  );
  test.finish();
};


var definition = {
    me: {
      url: '/users/current.json'
    },
    create: {
      url: '/users.json',
      format: 'json',
      wrap: 'user'  // wrap the data into { user: ... }
    },
    read: {
      url: '/users/{id}.json',
      cache: false,
    },
    update: {
      url: '/users/{id}.json',
      wrap: 'user'  // wrap the data into { user: ... }
    },
    del: {
      url: '/users/{id}.json'
    },
    list: {
      url: '/list.json',
      pagination: true,
      filter: {
        by_name: {
          param: 'query',
        },
        by_role: {
          param: 'role',
        }
      },
    },
    find: {
      by_organization: {
        url: '/organizations/{organization}/users.json',
        pagination: true
      },
      by_group: {
        url: '/groups/{group}/users.json',
        pagination: true
      },
    },
    has_many: {
      identities: function mock() { }
    }
  };

// resolveURL && execute

exports['read when number is passed'] = function(test){
  var s = new Search().where(333);
  test.deepEqual(
    definition.read,
    s.resolveURL(definition)
  );
  test.finish();
};

// cache tests

exports['read should check the cache'] = function(test){
  test.numAssertions = 3;
  definition.read.cache = {
        has: function(params) {
          test.ok(true);
          return true;
        },
        get: function(params) {
          test.ok(true);
          return { cache: true };
        },
        set: function(params, data) {
          test.ok(false);
        }
      };

  var s = new Search().where(333).execute(definition, {
    get: function() { test.ok(false); }
  }, function(data) {
    test.deepEqual(
      [ { cache:true } ],
      data
    );
    test.finish();
  });
};

exports['read should fall back to get if cache is empty and set cache'] = function(test) {
  var cached = {};
  definition.read.cache = {
        has: function(params) {
          test.ok(true);
          return !!params.id && !!cached[params.id];
        },
        get: function(params) {
          return cached[params.id];
        },
        set: function(params, data) {
          cached[params.id] = data;
        }
      };
  var s = new Search().where(333).execute(definition, {
    get: function(url, conditions, callback) {
      test.ok(true);
      callback({ get: true });
    },
    json: function(data) { return data; }
  }, function(data) {
    test.deepEqual(
      [ { get: true } ],
      data
    );
  });
  // we sould also read from the cache now
  var s = new Search().where(333).execute(definition, {
    get: function(url, conditions, callback) {
      test.ok(false); // should not do a get
    }
  }, function(data) {
    test.deepEqual(
      [ { get: true } ],
      data
    );
    test.finish();
  });
};


exports['list by name when string is passed'] = function(test) {
  var s = new Search().where("John Doe").execute(definition, { 
      get: function(url, conditions) {
          test.deepEqual(
            '/list.json',
            url
          );
          test.deepEqual(
            { query: "John Doe"},
            conditions
          );
          test.finish();
      }
    });
};

exports['list by name when name is passed'] = function(test) {
  var s = new Search().where({ name: "John Doe" }).execute(definition, { 
      get: function(url, conditions) {
        test.deepEqual(
          '/list.json',
          url
        );
        test.deepEqual(
          { query: "John Doe"},
          conditions
        );
        test.finish();
      }
    });
};

exports['list by role when role is passed'] = function(test) {
  var s = new Search().where({ role: 2 }).execute(definition, { 
      get: function(url, conditions) {
        test.deepEqual(
          '/list.json',
          url
        );
        test.deepEqual(
          { role: 2 },
          conditions
        );
        test.finish();
      }
    });
};

exports['find by organization when organization is passed'] = function(test) {
  var s = new Search().where({ organization: 999 }).execute(definition, { 
      get: function(url, conditions) {
        test.deepEqual(
          '/organizations/999/users.json',
          url
        );
        test.deepEqual(
          {},
          conditions
        );
        test.finish();
      }
    });
};

exports['find by group when group is passed'] = function(test) {
  var s = new Search().where({ group: 999 }).execute(definition, { 
      get: function(url, conditions) { 
        test.deepEqual(
          '/groups/999/users.json',
          url
        );
        test.deepEqual(
          {},
          conditions
        );
        test.finish();
      }
    });
};

// test the identities mock
// 1) when the search is an id, an id should be passed
// 2) when the search is not an id, it should first be resolved, then passed

// test configuration:
// { default_string: "username" }  -> passed string should map to username
// { default_int: "user" } -> passed string should map to user

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var async_testing = require('async_testing');
  process.nextTick(function() {
    async_testing.run(__filename, process.ARGV, function() { process.exit(); } );
  });
}
