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
  } else if(!condition) {
    // not set
    return this;
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
  var opts = this.resolveURL(definition);
  var urls = opts.urls;
  var filters = opts.filters;

  // remap from the selected key
  if(filters) {
    this.conditions = Search.remap(filters, this.conditions);
  }
  console.log(urls, this.conditions);
  if(_.isArray(urls)) {
    http.batch.get(urls, this.conditions, callback);
  } else {
    http.get(definition.list.url, this.conditions, function(data) {
      var items = http.json(data);
      callback(items);
    });    
  }
};

/**
 * Bind parameters to string.
 */
Search.bindURL = function(params, uri) {
  // find out which params are arrays
  var keys = Object.keys(params);
  var single = [];
  var multiple = [];
  keys.forEach(function(key){
    if(_.isArray(params[key])) {
      multiple.push(key);
    } else {
      single.push(key);      
    }
  })
  // bind each non-array param
  single.forEach(function(token){
    uri = uri.replace(new RegExp('{'+token+'}'), params[token]);
  })
  // create a new URL for each array param
  var urls = [];
  if(multiple.length > 0) {
    multiple.forEach(function(token){
      params[token].forEach(function(value) {
        urls.push(uri.replace(new RegExp('{'+token+'}'), value));        
      });
    });
    return urls;
  } else {
    return [ uri ];
  }
};

Search.getBindableParams = function(url) {
  // it seems that match returns the full match, even if we specify the part using (..)
  return url.match(/{([a-zA-Z0-9]+)}/g).map(function(param){
    return param.substring(1, param.length-1);
  });  
};

Search.prototype.resolveURL = function(definition) {
  // check that the conditions do not conflict!
  var self = this;
  var isRead = definition.read && definition.read.url && Search.getBindableParams(definition.read.url).every(function(param){
    return !!self.conditions[param];
  });
  var isList = definition.list && definition.list.url && Search.getBindableParams(definition.list.url).every(function(param){
    return !!self.conditions[param];
  });  
  
  var urls = [];
  if(isRead) {
    // if an ID is set, then we use the read URL 
    urls = Search.bindURL(this.conditions, definition.read.url);   
    Search.getBindableParams(definition.read.url).every(function(param){
      delete self.conditions[param];
    });
    return { urls: urls, filters: definition.read.filter || false };
  } else if(isList){

    urls = Search.bindURL(this.conditions, definition.list.url);   
    Search.getBindableParams(definition.list.url).every(function(param){
      delete self.conditions[param];
    });
    return { urls: urls, filters: definition.list.filter || false };

  } else {
    if(!definition.list){
      throw("No list URL.");
    }
     // if no ID has been set, then we use the list URL
    return { urls: definition.list.url, filters: definition.list.filter || false };
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