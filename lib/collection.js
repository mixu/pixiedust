
var Search = require('./search.js');

var Item = function( definition, data ) {
  this.definition = definition;
  this.data = data || {};
};

Item.prototype.create = function(data, callback) {
  console.log('Create', data, this.definition.create);
  this.data = data;
  // support for wrapping the JSON (for legacy APIs)
  if(this.definition.create.wrap) {
    var obj = {};
    obj[this.definition.create.wrap] = data;
    data = obj;
  } 
  Collection.client.post(this.definition.create.url, data, callback);  
  return this;
};

Item.prototype.update = function(data, callback) {
  var self = this;
  console.log('Update item', this.data, data);
  Object.keys(data).forEach(function(key) {
    self.data[key] = data[key];    
  });

  // support for wrapping the JSON (for legacy APIs)
  if(this.definition.update.wrap) {
    var obj = {};
    obj[this.definition.update.wrap] = data;
    data = obj;
  } 
  Collection.client.put(this.definition.update.url.replace(/{id}/, this.data.id), data, function() {
    callback(self);
  });  
  return this;
};

Item.prototype.del = function(callback) {
  console.log('Delete item', this.data);
  Collection.client.del(this.definition.del.url.replace(/{id}/, this.data.id), function() {
    callback && callback();
  });  
  return this;
};

var Collection = function( type, definition ) {
  this.type = type;
  this.definition = definition;
  this.criteria = {};
  this.search = new Search();
};

Collection.client = null;

Collection.prototype.execute = function(callback) {
  var self = this;
  var http = Collection.client;
  console.log('Criteria:', this.criteria);

  function process(data) {
    var items = http.json(data);
    if(Collection.isArray(items)) {
      var objects = items.map(function(item) { return new Item( self.definition, item); });      
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

Collection.prototype.create = function(data, callback){
  var item = new Item(this.definition).create(data, callback);
  return item;
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

