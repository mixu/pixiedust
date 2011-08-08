
var qs = require('querystring'),
    url = require('url');

/** 
 * Auth config
 *
 * Options:
 *  token: ''
 *  token_secret: ''
 */ 
var OAuth = function(config) {
  // specific config
  this.access_token = config.access_token;
};

OAuth.prototype.auth = function(opts) {
  // parse the url 
  var purl = url.parse( opts.path, true );
  var append = purl.query || {};
  // append the oauth token
  append.oauth_token = this.access_token;
  // restringify
  opts.path = purl.pathname +'?'+qs.stringify(append);
  return opts;
};

module.exports = OAuth;