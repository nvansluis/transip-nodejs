// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

var params = {
  commonName: 'foobar.example.com'
};

const haipName = 'transipdemo-haip';

transip.haips.certificates.add(params, haipName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(JSON.stringify(response, null, 4));
  }
});
