var Cache = function() {
  this.store = {};
};

Cache.prototype.has = function(type, id){
  return !!this.store[type] && !!this.store[type][id];
};

Cache.prototype.get = function(type, id) {
  if(!this.store[type] && !this.store[type][id]) {
    return undefined;
  }
  return this.store[type][id];
};

Cache.prototype.set = function(type, id, data) {
  this.store[type] || (this.store[type] = {});
  this.store[type][id] = data;  
};
