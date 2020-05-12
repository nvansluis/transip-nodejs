// requires
var transip = require('../../lib/transip.js')('', 12000);

// module variables
const config = require('../config.json');
const demo_token = config.demo_token;

var params = {
 haip: {
  name: 'transipdemo-haip',
  description: 'frontend cluster',
  status: 'active',
  isLoadBalancingEnabled: true,
  loadBalancingMode: 'cookie',
  stickyCookieName: 'PHPSESSID',
  healthCheckInterval: 3000,
  httpHealthCheckPath: '/status.php',
  httpHealthCheckPort: 443,
  httpHealthCheckSsl: true,
  ipv4Address: '37.97.254.7',
  ipv6Address: '2a01:7c8:3:1337::1',
  ipSetup: 'ipv6to4',
  ptrRecord: 'frontend.example.com',
  ipAddresses: [
    '10.3.37.1',
    '10.3.38.1'
  ]
  }
}

const haipName = 'transipdemo-haip';

transip.haips.update(params, haipName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(JSON.stringify(response, null, 4));
  }
});
