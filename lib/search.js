if(typeof exports != 'undefined') {
  var _ = require('./underscore_subset.js');
}

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
  var type = this.resolveURL(definition);
  var filters = type.filter || false;
  var cache = type.cache || false;
  // remap from the selected key
  if(filters) {
    this.conditions = Search.remap(filters, this.conditions);
  }
  var items = Search.resolveItems(this.conditions);
  // items is always an array
  var count = 0;
  var all_items = [];
  // populate all_items from data source
  function populate(items) {
    // add items to the accumulator
    if (_.isArray(items)) {
      items.forEach(function(item) {
        all_items.push(item);
      });
    } else {
      all_items.push(items);
    }
    count++;
    // if all done, execute the callback
    if(count == all_items.length) {
      callback(all_items);
    }
  }
  // batch read
  var bindable = Search.getBindableParams(type.url);
  items.forEach(function(query){
    if(cache && cache.has(query)) {
      populate(cache.get(query));
    } else {
      // late binding
      var url = Search.bindURL(query, type.url);
      // get rid of bound params
      // surprisingly, this is a fast way to **deep** clone an object
      var filtered = JSON.parse(JSON.stringify(query));
      bindable.every(function(param){
        delete filtered[param];
      });
      http.get(url, filtered, function(text) {
        var items = http.json(text);
        if(cache) {
          cache.set(query, items);
        }
        populate(items);
      });
    }
  });
};

Search.resolveItems = function(params) {
  // find out which params are arrays
  var keys = _.keys(params);
  var single = {};
  var multiple = [];
  keys.forEach(function(key){
    if(_.isArray(params[key])) {
      params[key].forEach(function(value){
        multiple.push({ key: key, value: value });
      })
    } else {
      single[key] = params[key];
    }
  })
  var items = [];
  if(multiple.length > 0) {
    multiple.forEach(function(item){
      // surprisingly, this is a fast way to **deep** clone an object
      var clone = JSON.parse(JSON.stringify(single));
      clone[item.key] = item.value;
      items.push( clone );
    });
    return items;
  } else {
    return [ params ];
  }
};

/**
 * Bind parameters to string.
 */
Search.bindURL = function(params, uri) {
  // bind each non-array param
  _.keys(params).forEach(function(token){
    uri = uri.replace(new RegExp('{'+token+'}'), params[token]);
  })
  return uri;
};

Search.getBindableParams = function(url) {
  // it seems that match returns the full match, even if we specify the part using (..)
  var params = url.match(/{([a-zA-Z0-9]+)}/g);
  if(params) {
    return params.map(function(param){
      return param.substring(1, param.length-1);
    });
  }
  return [];
};

Search.prototype.resolveURL = function(definition) {
  // check that the conditions do not conflict!
  var self = this;
  var isRead = definition.read && definition.read.url && Search.getBindableParams(definition.read.url).every(function(param){
    return !!self.conditions[param];
  });

  if(isRead) {
    // if an ID is set, then we use the read URL 
    return definition.read;
  } else {
    // check to see if this is a find
    if(definition.find) {
      var best_match = null;
      var best_match_count = 0;
      _.keys(definition.find).forEach(function(type) {
        if(definition.find[type].url) {
          // calculate the number
          var current_count = Search.getBindableParams(definition.find[type].url).reduce(function(value, param){          
            return (!!self.conditions[param]? value+1 : value);
          }, 0);
          if(current_count > best_match_count) {
            best_match = type;
            best_match_count = current_count;
          }
        }
      });
      // now use the best match
      if(best_match) {
        // if no ID has been set, then we use the list URL
        return definition.find[best_match];
      }
    }
    // otherwise, it's a list
    return definition.list;
  }
};


/**
 * Transform conditions where the parameter name is different from the filter name itself.
 */
Search.remap = function(filters, conditions) {
  _.keys(filters).forEach(function(by_name) {
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
if(typeof exports != 'undefined') {
  module.exports = Search;
}
