
/** 
 * Auth config
 *
 * Options:
 *   email: '', 
 *   password: ''
 */ 


var BasicAuth = function(config) {
  // specific config
  this.email = config.email;
  this.password = config.password;
};

/**
 * This gets polled by the http client to check whether it can proceed.
 *
 * Basic auth is always ready for action!
 */
BasicAuth.prototype.status = function() {
  return true;
};

BasicAuth.prototype.auth = function(opts) {
  opts.headers['Authorization'] = new Buffer(this.email+':'+this.password).toString('base64');
  return opts;
};

module.exports = BasicAuth;