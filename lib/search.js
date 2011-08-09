var _ = require('./underscore_subset.js');

var Search = function() {
  this.conditions = {};
  return this;
};

/**
 * Add a search condition.
 */
Search.prototype.where = function(condition) {
  var self = this;
  if(_.isString(condition)) {
    this.conditions.name = condition;
  } else if(_.isNumber(condition)) {
    if(this.conditions.id) {
      if(!_.isArray(this.conditions.id)) {
        this.conditions.id = [ this.conditions.id ];      
      }
      this.conditions.id.push(condition);
    } else {
      this.conditions.id = condition;
    }
  } else if(_.isArray(condition)) {
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

/**
 * Given an API definition and callback, execute the http requests.
 */
Search.prototype.execute = function(definition, http, callback) {
  var self = this;
  // check that the conditions do not conflict!
  var hasID = !!this.conditions.id;
  if(hasID) {
    var urls = [];
    // if an ID is set, then we use the read URL 
    if(_.isArray(this.conditions.id)) {
      this.conditions.id.forEach(function(id) {
        urls.push(definition.read.url.replace(/{id}/, this.conditions.id));
      });
    } else {
      urls.push(definition.read.url.replace(/{id}/, this.conditions.id));
    }
    delete this.conditions.id;      
    // remap from the selected key
    if(definition.read.filter) {
      this.conditions = Search.remap(definition.read.filter, this.conditions));
    }
    console.log(urls, this.conditions);
    http.batch.get(urls, this.conditions, callback);
  } else {
    // if no ID has been set, then we use the list URL
    // remap from the selected key
    if(definition.list.filter) {
      this.conditions = Search.remap(definition.list.filter, this.conditions));
    }
    console.log(definition.list.url, this.conditions);
    http.get(definition.list.url, this.conditions, callback);
  }
};

/**
 * Transform conditions where the parameter name is different from the filter name itself.
 */
Search.remap = function(filters, conditions) {
  Object.keys(filters).forEach(function(by_name) {
    // by_item -> item
    var filter = filters[by_name];
    var name = by_name.replace(/^by_/, '');
    // map item to item.param
    if(filter.param != name && conditions[name]) {
      conditions[filter.param] = conditions[name];
      delete conditions[name];
    }
  });
  return conditions;
};


// test

// non id
//new Search().where("End User").where({page: 1}).execute();
// ID
//new Search().where(1).execute();

module.exports = Search;