// requires
var transip = require('../../lib/transip.js')();

// module variables
const config = require('../config.json');
const demo_token = config.demo_token;

var params = {
  name: 'John Wick',
  telephone: '+31612345678',
  email: 'j.wick@example.com'
}

transip.monitoringcontacts.create(params, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(response);
  }
});
