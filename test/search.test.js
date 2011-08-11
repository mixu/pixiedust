var Search = require('../lib/search.js');
var assert = require('assert');

assert.deepEqual(
  [ '/users/123.json' ],
  Search.bindURL({ id: 123}, '/users/{id}.json')
);

assert.deepEqual(
  [ '/tickets/123' ],
  Search.bindURL({ id: 123}, '/tickets/{id}')
);

assert.deepEqual(
  [ '/repos/mixu/pixiedust' ],
  Search.bindURL({ user: 'mixu', id: 'pixiedust'}, '/repos/{user}/{id}')
);

// note that only one array param supported per expression!
assert.deepEqual(
  [ '/repos/mixu/pixiedust',
    '/repos/test/pixiedust',
  ],
  Search.bindURL({ user: [ 'mixu', 'test'], id: 'pixiedust'}, '/repos/{user}/{id}')
);


