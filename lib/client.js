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
      data = qs.stringify(data);
      opts.headers || (opts.headers = {});
      opts.headers['Content-Length'] = data.length;
      opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else {
      // JSON encoding
      data = JSON.stringify(data);
      opts.headers || (opts.headers = {});
      opts.headers['Content-Length'] = data.length;
      opts.headers['Content-Type'] = 'application/json';
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
 * Fetch results from one or more URLs, combine them into a single array and then call the callback
 */
Client.batch = {};

Client.batch.get = function(urls, data, callback) {
  var count = 0;
  var all_items = [];
  urls.forEach(function(url) {
    Client.get(url, data, function(items) {
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
      if(count == urls.length) {
        callback(all_items);
      }
    });
  });
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
