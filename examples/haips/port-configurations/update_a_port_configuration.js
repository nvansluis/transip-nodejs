// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

var params = {
  portConfiguration: {
    id: 10033,
    name: 'Website Traffic',
    sourcePort: 443,
    targetPort: 443,
    mode: 'https',
    endpointSslMode: 'on'
  }
};

const portConfigurationId = 10033;
const haipName = 'transipdemo-haip';

transip.haips.portconfigurations.update(params, portConfigurationId, haipName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(JSON.stringify(response, null, 4));
  }
});
