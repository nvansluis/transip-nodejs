// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

const domainName = 'transipdemo.net';

var params = {
  branding: {
      companyName: 'Example B.V.',
      supportEmail: 'admin@example.com',
      companyUrl: 'www.example.com',
      termsOfUsageUrl: 'www.example.com/tou',
      bannerLine1: 'Example B.V.',
      bannerLine2: 'Example',
      bannerLine3: 'http://www.example.com/products'
    }
};


transip.domains.branding.update(params, domainName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(response);
  }
});
