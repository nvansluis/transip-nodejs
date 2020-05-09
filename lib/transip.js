/**
 * transip.js
 *
 * @module transip
 *
 * author: Niels van Sluis, <niels@ipforward.nl>
 *
 * This module is based on the MessageBird REST API module.
 * See: https://github.com/messagebird/messagebird-nodejs
 *
 */

var http = require('https');
var querystring = require('querystring');
var uniqid = require('uniqid');
const crypto = require('crypto');
var pkg = require('../package.json');

/**
 * module.exports sets configuration
 * and returns an object with methods
 *
 * @param {String} privateKey
 * @param {Integer} timeout
 * @return {Object}
 */
module.exports = function (privateKey, timeout) {
  var config = {
    privateKey: privateKey,
    timeout: timeout || 5000
  };

  /**
   * httpRequest does the API call and process the response.
   *
   * @param {Object} requestParams
   * @param {String} requestParams.hostname
   * @param {String} requestParams.path
   * @param {String} requestParams.method
   * @param {String} requestParams.token
   * @param {Object} requestParams.params
   * @param {Function} callback
   * @return {Void}
   */
  function httpRequest(requestParams, callback) {
    var options = {};
    var complete = false;
    var body = null;
    var request;
    var signature = null;

    if (typeof requestParams === 'fuction') {
      callback = requestParams;
      requestParams = null;
    }

    /**
     * doCallback prevents multiple callback
     * calls emitted by node's http module
     *
     * @param {Error} err
     * @param {Mixed} res
     * @return {Void}
     */
    function doCallback(err, res) {
      if (!complete) {
        complete = true;
        callback(err, res || null);
      }
    }

    // build request
    options = {
      hostname: requestParams.hostname || 'api.transip.nl',
      path: requestParams.path,
      method: requestParams.method,
      headers: {
        'User-Agent': 'TransIP/ApiClient/' + pkg.version + ' Node.js/' + process.versions.node
      }
    };

    // all requests will be JSON
    options.headers['Content-Type'] = 'application/json';

    if (options.method === 'GET') {
      options.path += requestParams.params ? '?' + querystring.stringify(requestParams.params) : '';
    }
    else {
      // POST, PUT, PATCH, DELETE
      body = JSON.stringify(requestParams.params) || '';
      options.headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
    }

    // sign body and add the signature header to the request
    if (options.path == "/v6/auth") {
      // generate signature
      const signer = crypto.createSign('sha512');
      signer.update(body, 'utf8');
      signature = signer.sign(config.privateKey, 'base64');

      // add signature header
      options.headers['Signature'] = signature;
    }

    if (requestParams.token) {
      // add authorization header which holds the JSON web token
      options.headers['Authorization'] = 'Bearer ' + requestParams.token;
    }

    request = http.request(options);

    // set timeout
    request.on('socket', function (socket) {
      socket.setTimeout(parseInt(config.timeout, 10));
      socket.on('timeout', function () {
        request.abort();
      });
    });

    // process client error
    request.on('error', function (e) {
      var error = new Error('request failed: ' + e.message);

      if (error.message === 'ECONNRESET') {
        error = new Error('request timeout');
      }

      error.error = e;
      doCallback(error);
    });
    // process response
    request.on('response', function (response) {
      var data = [];
      var size = 0;
      var error = null;

      response.on('data', function (ch) {
        data.push(ch);
        size += ch.length;
      });

      response.on('close', function () {
        doCallback(new Error('request closed'));
      });

      response.on('end', function () {
        data = Buffer.concat(data, size)
          .toString()
          .trim();

        // POST, PUT, PATCH or DELETE succeded; The response contains an empty body.
        if (response.statusCode === 201 || response.statusCode === 204) {
          doCallback(null, true);
          return;
        }

        try {
          var contentDisposition = response.headers['content-disposition'];

          // check if response data is downloadable so it can't be parsed to JSON
          if (contentDisposition && contentDisposition.includes('attachment')) {
            doCallback(error, data);
            return;
          }

          data = JSON.parse(data);
          if (data.errors) {
            var clientErrors = data.errors.map(function (e) {
              return e.description + ' (code: ' + e.code + (e.parameter ? ', parameter: ' + e.parameter : '') + ')';
            });
            error = new Error('api error(s): ' + clientErrors.join(', '));
            error.statusCode = response.statusCode;
            error.errors = data.errors;
            data = null;
          }
        } catch (e) {
          error = new Error('response failed');
          error.statusCode = response.statusCode;
          error.error = e;
          data = null;
        }

        doCallback(error, data);
      });
    });

    // do request
    request.end(body);
  }


  // METHODS
  return {
    accesstoken: {

      /**
       * Create access token
       *
       * @param {Object} params
       * @param {Function} callback
       * @return {void}
       */
      create: function (params, callback) {

        params.nonce = uniqid();

        httpRequest({ method: 'POST', path: '/v6/auth', params: params }, callback);
      }
    },

    account: {
  
      invoices: {

        /* List all invoices
         *
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (token, callback) {
          httpRequest({ method: 'GET', path: '/v6/invoices', token: token }, callback);
        },

        /* List a single invoice
         *
         * @param {String} invoiceNumber
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        retrieve: function (invoiceNumber, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/invoices/' + invoiceNumber, token: token }, callback);
        },

        /* List invoice items by InvoiceNumber
         *
         * @param {String} invoiceNumber
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        items: function (invoiceNumber, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/invoices/' + invoiceNumber + '/invoice-items', token: token }, callback);
        },

        /* Retrieve an invoice as PDF file
         *
         * @param {String} invoiceNumber
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        pdf: function (invoiceNumber, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/invoices/' + invoiceNumber + '/pdf', token: token }, callback);
        },
      },

      sshkeys: {

        /* List all SSH keys
         *
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (token, callback) {
          httpRequest({ method: 'GET', path: '/v6/ssh-keys', token: token }, callback);
        },

        /* Get SSH key by id
         *
         * @param {String} id
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        retrieve: function (id, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/ssh-keys/' + id, token: token }, callback);
        },

        /* Add a new SSH key
         *
         * @param {Object} params
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        add: function (params, token, callback) {
          httpRequest({ method: 'POST', path: '/v6/ssh-keys', params: params, token: token }, callback);
        },

        /* Update a SSH key
         *
         * @param {Object} params
         * @param {String} id
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        update: function (params, id, token, callback) {
          httpRequest({ method: 'PUT', path: '/v6/ssh-keys/' + id, params: params, token: token }, callback);
        },

        /* Delete an SSH key
         *
         * @param {String} id
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        remove: function (id, token, callback) {
          //httpRequest({ method: 'DELETE', path: '/v6/ssh-keys/' + id, token: token }, callback);
          httpRequest({ method: 'DELETE', path: '/v6/ssh-keys/' + id, token: token }, callback);
        },

      },
    },

    general: {

      api: {

        /* API test
         *
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        test: function (token, callback) {
          httpRequest({ method: 'GET', path: '/v6/api-test', token: token }, callback);
        },
      },

      products: {

        /* List all products
         *
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (token, callback) {
          httpRequest({ method: 'GET', path: '/v6/products', token: token }, callback);
        },

        /* List specifications for product
         *
         * @param {String} productName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        retrieve: function (productName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/products/' + productName + '/elements', token: token }, callback);
        },
      },

      availabilityzones: {
      
        /* List available AvailibilityZones
         *
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (token, callback) {
          httpRequest({ method: 'GET', path: '/v6/availability-zones', token: token }, callback);
        },
      },
    },

    domains: {
      /* List all domains
       *
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      list: function (token, callback) {
        httpRequest({ method: 'GET', path: '/v6/domains', token: token }, callback);
      },

      /* Retrieve an existing domain
       *
       * @param {String} domainName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      retrieve: function (domainName, token, callback) {
        httpRequest({ method: 'GET', path: '/v6/domains/' + domainName, token: token }, callback);
      },

      /* Register a new domain
       *
       * @param {Object} params
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      register: function (params, token, callback) {
        httpRequest({ method: 'POST', path: '/v6/domains', params: params, token: token }, callback);
      },

      /* Transfer a domain
       *
       * @param {Object} params
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      transfer: function (params, token, callback) {
        httpRequest({ method: 'POST', path: '/v6/domains', params: params, token: token }, callback);
      },

      /* Update a domain
       *
       * @param {Object} params
       * @param {String} domainName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      update: function(params, domainName, token, callback) {
        httpRequest({ method: 'PUT', path: '/v6/domains/' + domainName, params: params, token: token }, callback);
      },

      contacts: {

        /**
         * List all contacts for a domain
         *
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         */
        list: function (domainName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/domains/' + domainName + '/contacts', token: token }, callback);
        },

        /* Update contacts for a domain
         *
         * @param {Object} params
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        update: function (params, domainName, token, callback) {
          httpRequest({ method: 'PUT', path: '/v6/domains/' + domainName + '/contacts', params: params, token: token }, callback);
        }
      },

      branding: {
      
        /* Get domain branding
         *
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        get: function (domainName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/domains/' + domainName + '/branding', token: token }, callback);
        },

        /* Update domain branding
         *
         * @param {Object} params
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        update: function(params, domainName, token, callback) {
          httpRequest({ method: 'PUT', path: '/v6/domains/' + domainName + '/branding', params: params, token: token }, callback);
        },
      },

      dns: {
        /* List all DNS entries for a domain
         *
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (domainName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/domains/' + domainName + '/dns', token: token }, callback);
        },

        /* Add a new single DNS entry to a domain
         *
         * @param {Object} params
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        add: function (params, domainName, token, callback) {
          httpRequest({ method: 'POST', path: '/v6/domains/' + domainName + '/dns', params: params, token: token }, callback);
        },

        /* Update single DNS entry
         *
         * @param {Object} params
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        update: function (params, domainName, token, callback) {
          httpRequest({ method: 'PATCH', path: '/v6/domains/' + domainName + '/dns', params: params, token: token }, callback);
        },
 
        /* Update all DNS entries for a domain
         *
         * @param {Object} params
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        updateall: function (params, domainName, token, callback) {
          httpRequest({ method: 'PUT', path: '/v6/domains/' + domainName + '/dns', params: params, token: token }, callback);
        },

        /* Remove a DNS entry from a domain
         *
         * @param {Object} params
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        remove: function (params, domainName, token, callback) {
          httpRequest({ method: 'DELETE', path: '/v6/domains/' + domainName + '/dns', params: params, token: token }, callback);
        },
      },

      dnssec: {

        /* List DNSSEC entries
         *
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (domainName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/domains/' + domainName + '/dnssec', token: token }, callback);
        },

        /* Update all DNSSEC entries
         *
         * @param {Object} params
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        update: function (params, domainName, token, callback) {
          httpRequest({ method: 'PUT', path: '/v6/domains/' + domainName + '/dnssec', params: params, token: token }, callback);
        },
      },

      nameservers: {

        /* List nameservers for a domain
         *
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (domainName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/domains/' + domainName + '/nameservers', token: token }, callback);
        },

        /* Update nameservers for a domain
         *
         * @param {Object} params
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        update: function(params, domainName, token, callback) {
          httpRequest({ method: 'PUT', path: '/v6/domains/' + domainName + '/nameservers', params: params, token: token }, callback);
        },
      },

      actions: {

        /* Get current domain action
         *
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        get: function (domainName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/domains/' + domainName + '/actions', token: token }, callback);
        },

        /* Retry domain action
         *
         * @param {Object} params
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        retry: function(params, domainName, token, callback) {
          httpRequest({ method: 'PATCH', path: '/v6/domains/' + domainName + '/actions', params: params, token: token }, callback);
        },

        /* Cancel domain action
         *
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        cancel: function (domainName, token, callback) {
          httpRequest({ method: 'DELETE', path: '/v6/domains/' + domainName + '/actions', token: token }, callback);
        },
      
      },

      ssl: {

        /* List all SSL certificates
         *
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (domainName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/domains/' + domainName + '/ssl', token: token }, callback);
        },

        /* Get SSL certificate by id
         *
         * @param {String} id
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        get: function(id, domainName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/domains/' + domainName + '/ssl/' + id, token: token }, callback);
        },
      },

      whois: {

        /* Get WHOIS information for a domain
         *
         * @param {String} domainName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        get: function (domainName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/domains/' + domainName + '/whois', token: token }, callback);
        },

      },
    },

  };
};
