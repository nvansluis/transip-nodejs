// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

const ipAddress = '149.210.192.186';
const vpsName = 'transipdemo-vps4';

transip.vps.ipaddresses.get(ipAddress, vpsName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(JSON.stringify(response, null, 4));
  }
});
