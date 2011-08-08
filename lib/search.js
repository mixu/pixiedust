var Search = function() {
  this.conditions = {};
  return this;
};

Search.prototype.default = function(callback) {
  http.get(this.definition.list.url, callback);
};

Search.prototype.string = function(string, callback) {
  http.get(this.definition.list.url, { query: this.criteria.search[0] }, process);
};

Search.prototype.integer = function(integer, callback) {
  http.get(this.definition.read.url.replace(/{id}/, this.criteria.search[0]), function(data) {
    console.log(data);
    var item = http.json(data);
    callback( [new Item(item)]);
  });                      
};

Search.prototype.where = function(condition) {
  var self = this;
  if(Search.isString(condition)) {
    this.conditions.name = condition;
  } else if(Search.isNumber(condition)) {
    this.conditions.id = condition;
  } else if(Search.isArray(condition)) {
    condition.forEach(function(item) {
      self.where(item);
    })
  } else {
    var keys = Object.keys(condition);
    keys.forEach(function(key){
      self.conditions[key] = condition[key];
    })
  }
  return this;
};

Search.prototype.execute = function(definition) {
  var selected, url;
  var self = this;
  // check that the conditions do not conflict!
  var hasID = !!this.conditions.id;
  if(hasID) {
    // if an ID is set, then we use the read URL  
    url = definition.read.url.replace(/{id}/, this.conditions.id);
    selected = definition.read;
    delete this.conditions.id;
  } else {
    // if no ID has been set, then we use the list URL
    url = definition.list.url;
    selected = definition.list;
  }
  // remap from the selected key
  if(selected.filter) {
    Object.keys(selected.filter).forEach(function(item) {
      // by_item -> item
      var obj = selected.filter[item];
      var name = item.replace(/^by_/, '');
      // map item to item.param
      if(obj.param != name && self.conditions[name]) {
        self.conditions[obj.param] = self.conditions[name];
        delete self.conditions[name];
      }
    });
  }

  console.log(url, this.conditions);
  return { url: url, data: this.conditions };
};

Search.isString = function(obj) {
  return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
};

Search.isNumber = function(obj) {
  return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
};

Search.isArray = Array.isArray || function(obj) {
  return toString.call(obj) === '[object Array]';
};

// test

// non id
//new Search().where("End User").where({page: 1}).execute();
// ID
//new Search().where(1).execute();

module.exports = Search;