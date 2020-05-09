// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

const domainName = 'transipdemo.net';

var params = {
  dnsEntry: {
      name: 'www',
      expire: 300,
      type: 'CNAME',
      content: '@',
    }
};

transip.domains.dns.remove(params, domainName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(response);
  }
});
