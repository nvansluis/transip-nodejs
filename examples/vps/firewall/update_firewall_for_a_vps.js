// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

var params = {
  vpsFirewall: {
    isEnabled: true,
    ruleSet: [
      {
        description: 'HTTP',
        startPort: 80,
        endPort: 80,
        protocol: 'tcp',
        whitelist: [
          '80.69.69.80/32',
          '80.69.69.100/32',
          '2a01:7c8:3:1337::1/128'
        ]
      }
    ]
  }
};

const vpsName = 'transipdemo-vps4';

transip.vps.firewall.update(params, vpsName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(JSON.stringify(response, null, 4));
  }
});
