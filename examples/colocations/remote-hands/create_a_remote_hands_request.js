// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

var params = {
  remoteHands: {
    coloName: 'transipdemo',
    contactName: 'Herman Kaakdorst',
    phoneNumber: '+31 612345678',
    expectedDuration: 15,
    instructions: 'Reboot server with label Loadbalancer0'
  }
};

const colocationName = 'transipdemo';

transip.colocations.remotehands.create(params, colocationName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(JSON.stringify(response, null, 4));
  }
});
