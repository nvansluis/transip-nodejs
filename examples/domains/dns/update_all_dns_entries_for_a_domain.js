// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

const domainName = 'transipdemo.net';

var params = {
  dnsEntries: [
    { 
      name: 'www',
      expire: 86400,
      type: 'A',
      content: '127.0.0.1',
    },
    {
      name: 'ftp',
      expire: 300,
      type: 'A',
      content: '127.0.0.2',
    }
  ]
};

transip.domains.dns.updateall(params, domainName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(response);
  }
});
