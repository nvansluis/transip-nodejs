// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

var params = {
  action: 'convert',
  description: 'BeforeItsAllBroken'
};

const backupId = 171891225;
const vpsName = 'transipdemo-vps4';

transip.vps.backups.convert(params, backupId, vpsName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(JSON.stringify(response, null, 4));
  }
});
