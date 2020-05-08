// requires
var transip = require('../../lib/transip.js')();

// module variables
const config = require('../config.json');
const demo_token = config.demo_token;

const domainName = 'transipdemo.net';

var params = {
  domain: {
      name: 'transipdemo.net',
      authCode: 'XXXXXXXX',
      isTransferLocked: false,
      registrationDate: '2016-01-01',
      renewalDate: '2020-01-01',
      isWhitelabel: false,
      cancellationDate: '2020-01-01 12:00:00',
      cancellationStatus: 'signed',
      isDnsOnly: false,
      tags: [
        'customTag',
        'anotherTag'
      ]
    }
};


transip.domains.update(params, domainName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(response);
  }
});
