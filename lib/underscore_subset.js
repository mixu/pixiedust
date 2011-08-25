
var _ = function(obj) { return new wrapper(obj); };
_.each = function(obj, iterator, context) {
  var breaker = {};
  if(obj.forEach == Array.prototype.forEach) {
    obj.forEach(iterator, context);
  } else {
    for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) {
        if (iterator.call(context, obj[key], key, obj) === breaker) return;
      }
    }
  }
};
_.isFunction = function(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
};
_.isUndefined = function(obj) {
    return obj === void 0;
};
_.isString = function(obj) {
  return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
};
_.isNumber = function(obj) {
  return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
};
_.isArray = Array.isArray || function(obj) {
  return toString.call(obj) === '[object Array]';
};

_.keys = Object.keys;

var wrapper = function(obj) { this._wrapped = obj; };
wrapper.prototype.each = function() {
  var args = Array.prototype.slice.call(arguments);
  Array.prototype.unshift.call(args, this._wrapped);
  return _.each.apply(_, args);
};
  
module.exports = _;
