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
    
    whitelabel: {

      /* Order a whitelabel account
       *
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      order: function (token, callback) {
        httpRequest({ method: 'POST', path: '/v6/whitelabel', token: token }, callback);
      },
    },

    domainavailability: {

      /* Check availability for domain names
       *
       * @param {String} domainName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      check: function (domainName, token, callback) {
        httpRequest({ method: 'GET', path: '/v6/domain-availability/' + domainName, token: token }, callback);
      },
    },

    tlds: {

      /* List all TLDs
       *
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      list: function (token, callback) {
        httpRequest({ method: 'GET', path: '/v6/tlds', token: token }, callback);
      },

      /* Get info for a TLD
       *
       * @param {String} tld
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      get: function (tld, token, callback) {
        httpRequest({ method: 'GET', path: '/v6/tlds/' + tld, token: token }, callback);
      },
    },

    vps: {
      /* List all VPSs
       *
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      list: function (token, callback) {
        httpRequest({ method: 'GET', path: '/v6/vps', token: token }, callback);
      },

      /* Get VPS by name
       *
       * @param {String} vpsName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      get: function (vpsName, token, callback) {
        httpRequest({ method: 'GET', path: '/v6/vps/' + vpsName, token: token }, callback);
      },

      /* Order a new VPS
       *
       * @param {Object} params
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      order: function (params, token, callback) {
        httpRequest({ method: 'POST', path: '/v6/vps', params: params, token: token }, callback);
      },

      /* Clone a VPS
       *
       * @param {Object} params
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      clone: function (params, token, callback) {
        httpRequest({ method: 'POST', path: '/v6/vps', params: params, token: token }, callback);
      },

      /* Update a VPS
       *
       * @param {Object} params
       * @param {String} vpsName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      update: function (params, vpsName, token, callback) {
        httpRequest({ method: 'POST', path: '/v6/vps/' + vpsName, params: params, token: token }, callback);
      },

      /* Start a VPS
       *
       * @param {Object} params
       * @param {String} vpsName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      start: function (params, vpsName, token, callback) {
        httpRequest({ method: 'PATCH', path: '/v6/vps/' + vpsName, params: params, token: token }, callback);
      },

      /* Stop a VPS
       *
       * @param {Object} params
       * @param {String} vpsName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      stop: function (params, vpsName, token, callback) {
        httpRequest({ method: 'PATCH', path: '/v6/vps/' + vpsName, params: params, token: token }, callback);
      },

      /* Reset a VPS
       *
       * @param {Object} params
       * @param {String} vpsName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      reset: function (params, vpsName, token, callback) {
        httpRequest({ method: 'PATCH', path: '/v6/vps/' + vpsName, params: params, token: token }, callback);
      },

      /* Handover a VPS
       *
       * @param {Object} params
       * @param {String} vpsName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      handover: function (params, vpsName, token, callback) {
        httpRequest({ method: 'PATCH', path: '/v6/vps/' + vpsName, params: params, token: token }, callback);
      },

      /* Cancel a VPS
       *
       * @param {Object} params
       * @param {String} vpsName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      cancel: function (params, vpsName, token, callback) {
        httpRequest({ method: 'DELETE', path: '/v6/vps/' + vpsName, params: params, token: token }, callback);
      },

      usage: {

        /* Get usage data for a VPS
         *
         * @param {Object} params
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        get: function (params, vpsName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/vps/' + vpsName + '/usage', params: params, token: token }, callback);
        },
      },

      vncdata: {

        /* Get VNC data for a VPS
         *
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        get: function (vpsName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/vps/' + vpsName + '/vnc-data', token: token }, callback);
        },

        /* Regenerate VNC token for a vps
         *
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        regenerate: function (vpsName, token, callback) {
          httpRequest({ method: 'PATCH', path: '/v6/vps/' + vpsName + '/vnc-data', token: token }, callback);
        },
      },

      addons: {

        /* List all addons for a VPS
         *
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (vpsName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/vps/' + vpsName + '/addons', token: token }, callback);
        },

        /* Order addons for a VPS
         *
         * @param {Object} params
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        order: function (params, vpsName, token, callback) {
          httpRequest({ method: 'POST', path: '/v6/vps/' + vpsName + '/addons', params: params, token: token }, callback);
        },

        /* Cancel an addon for a VPS
         *
         * @param {String} addonName
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        cancel: function (addonName, vpsName, token, callback) {
          httpRequest({ method: 'DELETE', path: '/v6/vps/' + vpsName + '/addons/' + addonName, token: token }, callback);
        },

      },

      upgrades: {

        /* List all upgrades for a VPS
         *
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (vpsName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/vps/' + vpsName + '/upgrades', token: token }, callback);
        },

        /* Upgrade a VPS
         *
         * @param {Object} params
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        upgrade: function (params, vpsName, token, callback) {
          httpRequest({ method: 'POST', path: '/v6/vps/' + vpsName + '/upgrades', params: params, token: token }, callback);
        },
      },

      operatingsystems: {
        /* List installable operating systems for a VPS
         *
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (vpsName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/vps/' + vpsName + '/operating-systems', token: token }, callback);
        },

        /* List installable operating systems for a VPS
         *
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        install: function (params, vpsName, token, callback) {
          httpRequest({ method: 'POST', path: '/v6/vps/' + vpsName + '/operating-systems', params: params, token: token }, callback);
        },
      },

      ipaddresses: {

        /* List IP addresses for a VPS
         *
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (vpsName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/vps/' + vpsName + '/ip-addresses', token: token }, callback);
        },

        /* Get IP address info by address
         *
         * @param {String} ipAddress
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        get: function (ipAddress, vpsName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/vps/' + vpsName + '/ip-addresses/' + ipAddress, token: token }, callback);
        },

        /* Add IPv6 address to a VPS
         *
         * @param {Object} params
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        add: function (params, vpsName, token, callback) {
          httpRequest({ method: 'POST', path: '/v6/vps/' + vpsName + '/ip-addresses', params: params, token: token }, callback);
        },

        /* Update reverse DNS for a VPS
         *
         * @param {Object} params
         * @param {Object} ipAddress
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        update: function (params, ipAddress, vpsName, token, callback) {
          httpRequest({ method: 'PUT', path: '/v6/vps/' + vpsName + '/ip-addresses/' + ipAddress, params: params, token: token }, callback);
        },

        /* Remove an IPv6 address from a VPS
         *
         * @param {String} ipAddress
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        remove: function (ipAddress, vpsName, token, callback) {
          httpRequest({ method: 'DELETE', path: '/v6/vps/' + vpsName + '/ip-addresses/' + ipAddress, token: token }, callback);
        },
      },

      snapshots: {

        /* List snapshots for a VPS
         *
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (vpsName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/vps/' + vpsName + '/snapshots', token: token }, callback);
        },

        /* Get snapshot by name
         *
         * @param {String} snapshotName
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        get: function (snapshotName, vpsName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/vps/' + vpsName + '/snapshots/' + snapshotName, token: token }, callback);
        },

        /* Create snapshot of a VPS
         *
         * @param {Object} params
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        create: function (params, vpsName, token, callback) {
          httpRequest({ method: 'POST', path: '/v6/vps/' + vpsName + '/snapshots', params: params, token: token }, callback);
        },

        /* Revert snapshot to a VPS
         *
         * @param {Object} params
         * @param {String} snapshotName
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        revert: function (params, snapshotName, vpsName, token, callback) {
          httpRequest({ method: 'PATCH', path: '/v6/vps/' + vpsName + '/snapshots/' + snapshotName, params: params, token: token }, callback);
        },

        /* Delete a snapshot
         *
         * @param {String} snapshotName
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        delete: function (snapshotName, vpsName, token, callback) {
          httpRequest({ method: 'DELETE', path: '/v6/vps/' + vpsName + '/snapshots/' + snapshotName, token: token }, callback);
        },

      },

      backups: {

        /* List backups for a VPS
         *
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (vpsName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/vps/' + vpsName + '/backups', token: token }, callback);
        },

        /* Revert backup to a VPS
         *
         * @param {Object} params
         * @param {String} backupId
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        revert: function (params, backupId, vpsName, token, callback) {
          httpRequest({ method: 'PATCH', path: '/v6/vps/' + vpsName + '/backups/' + backupId, params: params, token: token }, callback);
        },

        /* Convert backup to snapshot
         *
         * @param {Object} params
         * @param {String} backupId
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        convert: function (params, backupId, vpsName, token, callback) {
          httpRequest({ method: 'PATCH', path: '/v6/vps/' + vpsName + '/backups/' + backupId, params: params, token: token }, callback);
        },

      },

      firewall: {

        /* List firewall for a VPS
         *
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (vpsName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/vps/' + vpsName + '/firewall', token: token }, callback);
        },

        /* Update firewall for a VPS
         *
         * @param {Object} params
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        update: function (params, vpsName, token, callback) {
          httpRequest({ method: 'PUT', path: '/v6/vps/' + vpsName + '/firewall', params: params, token: token }, callback);
        },

      },

      tcpmonitors: {

        /* List all TCP monitors for a VPS
         *
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (vpsName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/vps/' + vpsName + '/tcp-monitors', token: token }, callback);
        },

        /* Create a TCP monitor for a VPS
         *
         * @param {Object} params
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        create: function (params, vpsName, token, callback) {
          httpRequest({ method: 'POST', path: '/v6/vps/' + vpsName + '/tcp-monitors', params: params, token: token }, callback);
        },

        /* Update a TCP monitor for a VPS
         *
         * @param {Object} params
         * @param {String} ipAddress
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        update: function (params, ipAddress, vpsName, token, callback) {
          httpRequest({ method: 'PUT', path: '/v6/vps/' + vpsName + '/tcp-monitors/' + ipAddress, params: params, token: token }, callback);
        },

        /* Delete a TCP monitor for a VPS
         *
         * @param {String} ipAddress
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        delete: function (ipAddress, vpsName, token, callback) {
          httpRequest({ method: 'DELETE', path: '/v6/vps/' + vpsName + '/tcp-monitors/' + ipAddress, token: token }, callback);
        },
      },
    },

    traffic: {

      /* Get traffic pool information
       *
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      get: function (token, callback) {
        httpRequest({ method: 'GET', path: '/v6/traffic', token: token }, callback);
      },

      vps: {

        /* Get traffic information for a VPS
         *
         * @param {String} vpsName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        get: function (vpsName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/traffic/' + vpsName, token: token }, callback);
        },
     
      },

    }, 

    privatenetworks: {

      /* List all private networks
       *
       * @param {Object} params
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      list: function (params, token, callback) {
        httpRequest({ method: 'GET', path: '/v6/private-networks', params: params, token: token }, callback);
      },

      /* Get private network by name
       *
       * @param {String} privateNetwork
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      get: function (privateNetwork, token, callback) {
        httpRequest({ method: 'GET', path: '/v6/private-networks/' + privateNetwork, token: token }, callback);
      },

      /* Order a new private network
       *
       * @param {Object} params
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      order: function (params, token, callback) {
        httpRequest({ method: 'POST', path: '/v6/private-networks', params: params, token: token }, callback);
      },

      /* Update private network
       *
       * @param {Object} params
       * @param {String} privateNetworkName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      update: function (params, privateNetworkName, token, callback) {
        httpRequest({ method: 'PUT', path: '/v6/private-networks/' + privateNetworkName, params: params, token: token }, callback);
      },

      /* Attach VPS to private network
       *
       * @param {Object} params
       * @param {String} privateNetworkName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      attach: function (params, privateNetworkName, token, callback) {
        httpRequest({ method: 'PATCH', path: '/v6/private-networks/' + privateNetworkName, params: params, token: token }, callback);
      },

      /* Detach VPS from private network
       *
       * @param {Object} params
       * @param {String} privateNetworkName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      detach: function (params, privateNetworkName, token, callback) {
        httpRequest({ method: 'PATCH', path: '/v6/private-networks/' + privateNetworkName, params: params, token: token }, callback);
      },

      /* Cancel a private network
       *
       * @param {Object} params
       * @param {String} privateNetworkName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      cancel: function (params, privateNetworkName, token, callback) {
        httpRequest({ method: 'DELETE', path: '/v6/private-networks/' + privateNetworkName, params: params, token: token }, callback);
      },

    },

    bigstorages: {
 
      /* List backups for a big storage
       *
       * @param {String} bigStorageName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      list: function (bigStorageName, token, callback) {
        httpRequest({ method: 'GET', path: '/v6/big-storages/' + bigStorageName, token: token }, callback);
      },

      /* Revert a big storage backup
       *
       * @param {Object} params
       * @param {String} backupId
       * @param {String} bigStorageName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      revert: function (params, backupId, bigStorageName, token, callback) {
        httpRequest({ method: 'PATCH', path: '/v6/big-storages/' + bigStorageName + '/backups/' + backupId, params: params, token: token }, callback);
      },

      /* Get big storage usage statistics
       *
       * @param {String} bigStorageName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      usage: function (bigStorageName, token, callback) {
        httpRequest({ method: 'GET', path: '/v6/big-storages/' + bigStorageName + '/usage', token: token }, callback);
      },
      
    },

    mailservice: {

      /* Get mail service information
       *
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      get: function (token, callback) {
        httpRequest({ method: 'GET', path: '/v6/mail-service', token: token }, callback);
      },

      /* Regenerate mail service password
       *
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      regenerate: function (token, callback) {
        httpRequest({ method: 'PATCH', path: '/v6/mail-service', token: token }, callback);
      },

      /* Add mail services DNS entries to domains
       *
       * @param {Object} params
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      add: function (params, token, callback) {
        httpRequest({ method: 'POST', path: '/v6/mail-service', params: params, token: token }, callback);
      },

    },

    monitoringcontacts: {

      /* List all contacts
       *
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      list: function (token, callback) {
        httpRequest({ method: 'GET', path: '/v6/monitoring-contacts', token: token }, callback);
      },

      /* Create a contact
       *
       * @param {Object} params
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      create: function (params, token, callback) {
        httpRequest({ method: 'POST', path: '/v6/monitoring-contacts', params: params, token: token }, callback);
      },

      /* Update a contact
       *
       * @param {Object} params
       * @param {String} contactId
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      update: function (params, contactId, token, callback) {
        httpRequest({ method: 'PUT', path: '/v6/monitoring-contacts/' + contactId, params: params, token: token }, callback);
      },

      /* Update a contact
       *
       * @param {String} contactId
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      delete: function (contactId, token, callback) {
        httpRequest({ method: 'DELETE', path: '/v6/monitoring-contacts/' + contactId, token: token }, callback);
      },

    },

    haips: {

      /* List all HA-IPs
       *
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      list: function (token, callback) {
        httpRequest({ method: 'GET', path: '/v6/haips', token: token }, callback);
      },

      /* Get HA-IP info
       *
       * @param {String} haipName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      get: function (haipName, token, callback) {
        httpRequest({ method: 'GET', path: '/v6/haips/' + haipName, token: token }, callback);
      },

      /* Order a new HA-IP
       *
       * @param {Object} params
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      order: function (params, token, callback) {
        httpRequest({ method: 'POST', path: '/v6/haips', params: params, token: token }, callback);
      },

      /* Update a HA-IP
       *
       * @param {Object} params
       * @param {String} haipName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      update: function (params, haipName, token, callback) {
        httpRequest({ method: 'PUT', path: '/v6/haips/' + haipName, params: params, token: token }, callback);
      },

      /* Cancel a HA-IP
       *
       * @param {Object} params
       * @param {String} haipName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      cancel: function (params, haipName, token, callback) {
        httpRequest({ method: 'DELETE', path: '/v6/haips/' + haipName, params: params, token: token }, callback);
      },

      certificates: {
 
        /* List all HA-IP certificates
         *
         * @param {String} haipName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (haipName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/haips/' + haipName + '/certificates', token: token }, callback);
        },

        /* Add existing certificate to HA-IP
         *
         * @param {Object} params
         * @param {String} haipName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        add: function (params, haipName, token, callback) {
          httpRequest({ method: 'POST', path: '/v6/haips/' + haipName + '/certificates', params: params, token: token }, callback);
        },

        /* Detach a certificate from this HA-IP
         *
         * @param {String} certificateId
         * @param {String} haipName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        detach: function (certificateId, haipName, token, callback) {
          httpRequest({ method: 'DELETE', path: '/v6/haips/' + haipName + '/certificates/' + certificateId, token: token }, callback);
        },

      },

      ipaddresses: {

        /* List all IPs attached to a HA-IP
         *
         * @param {String} haipName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (haipName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/haips/' + haipName + '/ip-addresses', token: token }, callback);
        },

        /* Set HA-IP attached IP addresses
         *
         * @param {Object} params
         * @param {String} haipName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        set: function (params, haipName, token, callback) {
          httpRequest({ method: 'PUT', path: '/v6/haips/' + haipName + '/ip-addresses', params: params, token: token }, callback);
        },

        /* Detach all IPs from HA-IP
         *
         * @param {String} haipName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        detach: function (haipName, token, callback) {
          httpRequest({ method: 'DELETE', path: '/v6/haips/' + haipName + '/ip-addresses', token: token }, callback);
        },

      },

      portconfigurations: {

        /* List all HA-IP port configurations
         *
         * @param {String} haipName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (haipName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/haips/' + haipName + '/port-configurations', token: token }, callback);
        },

        /* Get info about a specific PortConfiguration
         *
         * @param {String} portConfigurationId
         * @param {String} haipName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        get: function (portConfigurationId, haipName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/haips/' + haipName + '/port-configurations/' + portConfigurationId, token: token }, callback);
        },

        /* Create a port configuration
         *
         * @param {Object} params
         * @param {String} haipName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        create: function (params, haipName, token, callback) {
          httpRequest({ method: 'POST', path: '/v6/haips/' + haipName + '/port-configurations', params: params, token: token }, callback);
        },

        /* Update a port configuration
         *
         * @param {Object} params
         * @param {String} portConfigurationId
         * @param {String} haipName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        update: function (params, portConfigurationId, haipName, token, callback) {
          httpRequest({ method: 'PUT', path: '/v6/haips/' + haipName + '/port-configurations/' + portConfigurationId, params: params, token: token }, callback);
        },

        /* Remove a port configuration
         *
         * @param {String} portConfigurationId
         * @param {String} haipName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        remove: function (portConfigurationId, haipName, token, callback) {
          httpRequest({ method: 'DELETE', path: '/v6/haips/' + haipName + '/port-configurations/' + portConfigurationId, token: token }, callback);
        },

      },

      statusreports: {

        /* Get a full status report for a HA-IP
         *
         * @param {String} haipName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        get: function (haipName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/haips/' + haipName + '/status-reports', token: token }, callback);
        },
      
      },
      
    },

    colocations: {

      /* List all colocations
       *
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      list: function (token, callback) {
        httpRequest({ method: 'GET', path: '/v6/colocations', token: token }, callback);
      },

      /* Get colocation
       *
       * @param {String} colocationName
       * @param {String} token
       * @param {Function} callback
       * @return {void}
       */
      get: function (colocationName, token, callback) {
        httpRequest({ method: 'GET', path: '/v6/colocations/' + colocationName, token: token }, callback);
      },

      ipaddresses: {

        /* List IP addresses for a colocation
         *
         * @param {String} colocationName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        list: function (colocationName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/colocations/' + colocationName + '/ip-addresses', token: token }, callback);
        },

        /* Get IP addresses for a colocation
         *
         * @param {String} ipAddress
         * @param {String} colocationName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        get: function (ipAddress, colocationName, token, callback) {
          httpRequest({ method: 'GET', path: '/v6/colocations/' + colocationName + '/ip-addresses/' + ipAddress, token: token }, callback);
        },

        /* Create a new IP address for a colocation
         *
         * @param {Object} param
         * @param {String} colocationName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        create: function (params, colocationName, token, callback) {
          httpRequest({ method: 'POST', path: '/v6/colocations/' + colocationName + '/ip-addresses', params: params, token: token }, callback);
        },

        /* Set reverse DNS for an IP address
         *
         * @param {Object} param
         * @param {String} ipAddress
         * @param {String} colocationName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        set: function (params, ipAddress, colocationName, token, callback) {
          httpRequest({ method: 'PUT', path: '/v6/colocations/' + colocationName + '/ip-addresses/' + ipAddress, params: params, token: token }, callback);
        },

        /* Delete an IP address
         *
         * @param {String} ipAddress
         * @param {String} colocationName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        delete: function (ipAddress, colocationName, token, callback) {
          httpRequest({ method: 'DELETE', path: '/v6/colocations/' + colocationName + '/ip-addresses/' + ipAddress, token: token }, callback);
        },

      },

      remotehands: {

        /* Create a Remotehands request
         *
         * @param {Object} param
         * @param {String} colocationName
         * @param {String} token
         * @param {Function} callback
         * @return {void}
         */
        create: function (params, colocationName, token, callback) {
          httpRequest({ method: 'POST', path: '/v6/colocations/' + colocationName + '/remote-hands', params: params, token: token }, callback);
        },
      },
    },

  };
};
