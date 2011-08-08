var https = require('https'),
    http = require('http'),
    qs = require('querystring');

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
      console.log('GET append', data);
      opts.path += '?'+qs.stringify(data);
    } else {
      data = qs.stringify(data);
      opts['Content-Length'] = data.length;
      opts['Content-Type'] = 'application/x-www-form-urlencoded';
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
        callback(res_data, (response.headers ? response.headers : {}));
      });      
    });
  proxy.on('error', function(e) {
    console.log("Got error: " + e.message);
  });
  if (arguments.length == 4 && method != 'GET') {
//    console.log(data);
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