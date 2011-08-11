
var qs = require('querystring'),
    url = require('url');

/** 
 * Oauth config
 *
 * 1. Full workflow
 *
 * Before doing anything, you should register your app at the service provider site, and get
 * a client_id and client_secret.
 *
 * Then have your main app obtain a code (e.g. redirect the user to the authorize endpoint 
 * at the service provider) from the service provider.
 * 
 * Now, this client comes into play. You can specify the following:
 *
 *  client_id: ''
 *  client_secret: ''
 *  code: ''
 *  access_token_url: ''
 *  (optional) refresh_token_url: ''
 *
 * In this case, this client will make a POST to access_token_url with: the code, client_id, client_secret,
 * (optionally) redirect_uri and grant_type=authorization_code and read back the access_token,
 * then continue using it.
 *
 * 2. Reuse known access token
 *  
 * Or just directly set the access token:
 *  
 *  access_token: ''
 *  (optional) client_id: ''
 *  (optional) client_secret: ''
 *  (optional) refresh_token: ''
 *  (optional) refresh_token_url: ''
 *
 * The client_id, client_secret and refresh_token are only used when the token is refreshed.
 *
 * 3. Refreshing the token
 *
 * When the auth token is invalid (not currently detected), the client will make a POST request to
 * refresh_token_url with client_id, client_secret, refresh_token and grant_type=refresh_token.
 *
 */ 
var OAuth = function(config) {
  var self = this;
  [ 'client_id', 'client_secret',
    // (optional) code
    'code',
    // (optional) access token related fields
    'access_token', 'access_token_url',
    // (optional) refresh token related fields
    'refresh_token', 'refresh_token_url',
  ].forEach(function(field){
    if(config[field]) {
      self[field] = config[field];
    }
  });

  if(config.access_token) {
    // reuse known access token
    this.access_token = config.access_token;
    this.is_ready = true;
  } else {
    // fetch a new access_token
    this.is_ready = false;
    // parse the access_token_url
    //var uri = url.parse
    var req = require('https').request({
      host: 'github.com',
      path: '/login/oauth/access_token',
      method: 'POST'
    }, function(res){
      res.setEncoding('utf8');
      var result = '';
      res.on('data', function(data) {
        result += data;
      });
      res.on('end', function() {
        try {
          // try parsing as JSON
          var token = JSON.parse(result);
        } catch(err) {
          // try parsing as querystring
          token = qs.parse(result);
        }
        if(!token.access_token) {
          console.log('Could not parse', result);
          process.exit();            
        }
        console.log(result);
        this.access_token = token.access_token;
        this.is_ready = true;
      });      
    });
    req.write(qs.stringify({
      client_id: self.client_id,
      client_secret: self.client_secret,
      code: self.code
    }));
    req.on('error', function(err) {
        console.log(err);
        throw err;
    });
    req.end(); 
  }
};

/**
 * This gets polled by the http client to check whether it can proceed.
 *
 * Return false if we're in the middle of an operation.
 */
OAuth.prototype.status = function(){
  return this.is_ready;
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


