// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

var params = {
  ipAddress: {
    address: '149.210.192.186',
    subnetMask: '255.255.255.0',
    gateway: '149.210.192.1',
    dnsResolvers: [
      '195.8.195.8',
      '195.135.195.135'
    ],
    reverseDns: 'example.com'
  }
};

const ipAddress = '';
const vpsName = 'transipdemo-vps4';

transip.vps.ipaddresses.update(params, ipAddress, vpsName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(JSON.stringify(response, null, 4));
  }
});
