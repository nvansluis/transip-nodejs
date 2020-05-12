// requires
var transip = require('../../lib/transip.js')();

// module variables
const config = require('../config.json');
const demo_token = config.demo_token;

var params = {
  privateNetwork: {
    name: 'transipdemo-privatenetwork',
    description: 'FilesharingNetwork',
    isBlocked: false,
    isLocked: false,
    vpsNames: [
      'example-vps',
      'example-vps2'
    ]
  }
};

const privateNetworkName = 'transipdemo-privatenetwork';

transip.privatenetworks.update(params, privateNetworkName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(response);
  }
});
