
var Search = require('./search.js');

var Item = function( data ) {
  this.data = data;
};

Item.prototype.create = function(data) {
  console.log('Create item');
};

Item.prototype.update = function(data) {
  console.log('Update item', this.data, data);
};

Item.prototype.del = function() {
  console.log('Delete item', this.data);
};

var Collection = function( type, definition ) {
  this.type = type;
  this.definition = definition;
  this.criteria = {};
  this.search = new Search();
};

Collection.client = null;

Collection.prototype.execute = function(callback) {
  console.log('Criteria:', this.criteria);
  var http = Collection.client;

  function process(data) {
    var items = http.json(data);
    if(Collection.isArray(items)) {
      var objects = items.map(function(item) { return new Item(item); });      
      callback(objects);  
    } else {
      callback( [ items ]);
    }
  }
  var obj = this.search.execute(this.definition);
  http.get(obj.url, obj.data, process);
};

Collection.prototype.page = function(selectors, callback) {
  this.search.where({ page: selectors });
  if(!callback){
    return this;
  } else {
    return this.execute(callback);
  }
};

Collection.prototype.each = function(callback) {
  return this.execute(function(items){
    items.forEach(callback);
  });
};

Collection.prototype.create = function(data){
  console.log('Create', data, this.definition.create);
  return this;
}

Collection.prototype.update = function(data){
  this.each(function(item){
    item.update(data);
  });
}

Collection.prototype.del = function(data) {
  this.each(function(item){
    item.del();
  });
};

Collection.getCallback = function() {
  var args = Array.prototype.slice.call(arguments);  
  if(Collection.isFunction(args[args.length-1])) {
    return args[args.length-1];
  }
  return false;
};

Collection.getArguments = function() {
  var args = Array.prototype.slice.call(arguments);  
  if(Collection.isFunction(args[args.length-1])) {
    return args.slice(0, -1);
  }
  return args;
};

Collection.isArray = Array.isArray || function(obj) {
  return toString.call(obj) === '[object Array]';
};


Collection.isFunction = function(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
};


Collection.initialize = function(type, definition) {  
  return function(selectors, callback) {
    var selected = new Collection(type, definition);
    Collection.getArguments.apply(Collection, arguments).forEach(function(arg){
      selected.search.where(arg);
    }); 
    callback = Collection.getCallback.apply(Collection, arguments);
    if(!callback) {
      return selected; 
    } else {
      return selected.execute(callback);
    };
  };
};


module.exports = Collection;

