// requires
var transip = require('../../lib/transip.js')();

// module variables
const config = require('../config.json');
const demo_token = config.demo_token;

var params = {
  action: 'detachvps',
  vpsName: 'transipdemo-vps4'
};

const privateNetworkName = 'transipdemo-privatenetwork';

transip.privatenetworks.detach(params, privateNetworkName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(response);
  }
});
