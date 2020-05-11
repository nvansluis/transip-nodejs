// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

var params = {
  ipAddress: '2a01:7c8:aab5:5d7::2'
};

const vpsName = 'transipdemo-vps4';

transip.vps.ipaddresses.add(params, vpsName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(JSON.stringify(response, null, 4));
  }
});
