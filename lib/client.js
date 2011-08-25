var https = require('https'),
    http = require('http'),
    qs = require('querystring');

var _ = require('./underscore_subset.js');

var Client = function(config) {
  Client.host = config.host;
  Client.port = config.port;
  Client.secure = config.secure || false;
  Client.auth = config.auth || { auth: function(opts) { return opts; } };
  return Client;
};

/**
 * Wrapper around http.request.
 */
Client.request = function(method, url) {
  var opts = { 
    host: Client.host, 
    port: Client.port || 443,
    path: url, 
    method: method,
  };
  var data, callback;
  if(arguments.length == 3) {
    // data is optional
    callback = arguments[2];    
  } else if (arguments.length == 4) {
    data = arguments[2];
    callback = arguments[3];
    if(method == 'GET') {
      // append to QS
      // console.log('GET append', data);
      opts.path += '?'+qs.stringify(data);
    } else if(false) {
      // POST encoding
      opts.headers || (opts.headers = {});
      opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      data = qs.stringify(data);
      opts.headers['Content-Length'] = data.length;
    } else {
      // JSON encoding
      opts.headers || (opts.headers = {});
      opts.headers['Content-Type'] = 'application/json';
      data = JSON.stringify(data);
      opts.headers['Content-Length'] = data.length;
    }
  }
  var res_data = '';
  var protocol = (Client.secure ? https : http);
  opts = Client.auth.auth(opts);
  console.log(opts, (Client.secure ? 'https' : 'http'));
  var proxy = protocol.request(opts, function(response) {
      response.on('data', function(chunk) {
        res_data += chunk;
      });
      response.on('end', function() {
        if(response.headers && response.headers.location) {
          console.log('Redirect to: ', response.headers.location);          
        }
        if(callback) {
          callback(res_data, (response.headers ? response.headers : {}));
        }
      });      
    });
  proxy.on('error', function(e) {
    console.log("Got error: " + e.message);
  });
  if (arguments.length == 4 && method != 'GET') {
    console.log('Result from ', method, data);
    proxy.write(data);
  }
  proxy.end();    
};

/**
 * Issue a GET request.
 */
Client.get = function(url, data, callback) {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('GET');
  Client.request.apply(Client, args);
};

/**
 * Issue a POST request.
 */
Client.post = function(url, data, callback) {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('POST');
  Client.request.apply(Client, args);
};

/**
 * Issue a PUT request.
 */
Client.put = function(url, data, callback) {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('PUT');
  Client.request.apply(Client, args);
};

Client.del = function(url, data, callback) {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('DELETE');
  Client.request.apply(Client, args);
};

/**
 * Parse JSON.
 */
Client.json = function(data) {
  try{
    var data = JSON.parse(data);
  } catch(e) {
    return false;
  }
  return data;  
};

module.exports = Client;
