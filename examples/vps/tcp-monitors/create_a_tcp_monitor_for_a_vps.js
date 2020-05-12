// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

var params = {
  tcpMonitor: {
    ipAddress: '149.210.192.186',
    label: 'HTTP',
    ports: [
      80,
      443
    ],
    interval: 6,
    allowedTimeouts: 1,
    contacts: [
      {
        id: 1,
        enableEmail: true,
        enableSMS: false
      }
    ],
    ignoreTimes: [
      {
        timeFrom: '18:00',
        timeTo: '08:30'
      }
    ]
  }
}

const vpsName = 'transipdemo-vps4';

transip.vps.tcpmonitors.create(params, vpsName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(JSON.stringify(response, null, 4));
  }
});
