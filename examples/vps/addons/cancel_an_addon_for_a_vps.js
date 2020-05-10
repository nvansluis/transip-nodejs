// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

const addonName = 'vps-addon-monitoring';
const vpsName = 'transipdemo-vps4';

transip.vps.addons.cancel(addonName, vpsName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(JSON.stringify(response, null, 4));
  }
});
