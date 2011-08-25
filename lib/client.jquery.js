
var Client = function(config) {
  Client.host = config.host;
  Client.port = config.port;
  Client.secure = config.secure || false;
  Client.auth = config.auth || { auth: function(opts) { return opts; } };
  return Client;
};

Client.request = function(method, url) {
  var data, callback;
  var opts = {
    type: method,
    url: 'http://'+Client.host+url,
    processData: false, // we'll do this ourself
    dataType: 'text', // do not autoparse, some APIs like ZD's send empty responses as application/JSON and that causes problems
    cache: false,
    error: function(jqXHR, textStatus, errorThrown) {
      console.log('Fail', textStatus, errorThrown);
      if(callback) {
        callback({}, {});
      }
    },
    success: function(data, textStatus, jqXHR) {
      console.log('Success', data, textStatus, jqXHR);
      if(callback) {
        callback(Client.json(data), {});
      }
    }
  };
  if(arguments.length == 3) {
    // data is optional
    callback = arguments[2];    
  } else if (arguments.length == 4) {
    data = arguments[2];
    callback = arguments[3];
    if(method == 'GET') {
      // append to QS
      // console.log('GET append', data);
      opts.url += '?'+jQuery.param(data);
    } else if(false) {
      // POST encoding
      opts.contentType = 'application/x-www-form-urlencoded';
      opts.data = jQuery.param(data);
    } else {
      // JSON encoding
      opts.contentType = 'application/json';
      opts.data = JSON.stringify(data);
    }
  }  
  opts = Client.auth.auth(opts);
  console.log('jq.ajax', opts);
  jQuery.ajax(opts);
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

/**
 * Issue a DELETE request.
 */
Client.del = function(url, data, callback) {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('DELETE');
  Client.request.apply(Client, args);
};

/**
 * Parse JSON.
 */
Client.json = function(data) {
  try {
   var json = (typeof data == 'string' ? JSON.parse(data) : data);
  } catch(e) {
    return data;
  }
  return json;  
};
