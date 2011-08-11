var _ = require('./underscore_subset.js');
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
    callback && callback(self);
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
  this.search = new Search();
};

Collection.client = null;

Collection.prototype.makeItem = function(data) {
  var item = new Item(this.definition, data);
  var self = this;
  // map has_many to the item
  if(this.definition && this.definition.has_many) {
    Object.keys(this.definition.has_many).forEach(function(key) {
      item[key] = function(selectors, callback) { 
        selectors || (selectors = {});
        selectors.user = "mixu";
        console.log('INJECT PARAM', selectors);
        return self.definition.has_many[key](selectors, callback);
      };
    });
  }
  return item;
};

Collection.prototype.execute = function(callback) {
  var self = this;
  var http = Collection.client;

  function process(items) {
    if(_.isArray(items)) {
      var objects = items.map(function(data) { return self.makeItem(data); });      
      callback(objects);  
    } else {
      callback( [ items ]);
    }
  }
  this.search.execute(this.definition, Collection.client, process);
};

Collection.prototype.page = function(selector, callback) {
  this.search.where({ page: selector });
  return (!callback ? this : this.execute(callback) );
};

Collection.prototype.per_page = function(selector, callback) {
  this.search.where({ per_page: selector });
  return (!callback ? this : this.execute(callback) );
};

Collection.prototype.each = function(callback) {
  return this.execute(function(items){
    items.forEach(callback);
  });
};

Collection.prototype.create = function(data, callback){
  var item = self.makeItem({}).create(data, callback);
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
  if(typeof args[args.length-1] === "function") {    
    return args[args.length-1];
  }
  return false;
};

Collection.getArguments = function() {
  var args = Array.prototype.slice.call(arguments);  
  if(typeof args[args.length-1] === "function") {
    return args.slice(0, -1);
  }
  return args;
};

Collection.initialize = function(type, definition) {  
  return function(selectors, callback) {
    var selected = new Collection(type, definition);
    Collection.getArguments.apply(Collection, arguments).forEach(function(arg){
      selected.search.where(arg);
    }); 
    callback = Collection.getCallback.apply(Collection, arguments);
    return (!callback ? selected : selected.execute(callback) );
  };
};


module.exports = Collection;
