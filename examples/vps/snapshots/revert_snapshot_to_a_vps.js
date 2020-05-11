// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

var params = {
  destinationVpsName: 'transipdemo-vps3'
};

const snapshotName = '1572607577';
const vpsName = 'transipdemo-vps4';

transip.vps.snapshots.revert(params, snapshotName, vpsName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(JSON.stringify(response, null, 4));
  }
});
