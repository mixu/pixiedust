
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


BasicAuth.prototype.auth = function(opts) {
  opts.headers['Authorization'] = new Buffer(this.email+':'+this.password).toString('base64');
  return opts;
};

module.exports = BasicAuth;