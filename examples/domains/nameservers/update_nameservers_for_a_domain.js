// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

const domainName = 'transipdemo.net';

var params = {
  nameservers: [
    {
      hostname: 'ns0.example.com',
      ipv4: '',
      ipv6: ''
    },
    {
      hostname: 'ns1.example.com',
      ipv4: '',
      ipv6: ''
    }
  ]
};


transip.domains.nameservers.update(params, domainName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(response);
  }
});
