// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

var params = {
  ipAddresses: [
    '149.13.3.7',
    '149.31.33.7'
  ]
};

const haipName = 'transipdemo-haip';

transip.haips.ipaddresses.set(params, haipName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(JSON.stringify(response, null, 4));
  }
});
