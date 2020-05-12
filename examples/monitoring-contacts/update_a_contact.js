// requires
var transip = require('../../lib/transip.js')();

// module variables
const config = require('../config.json');
const demo_token = config.demo_token;

var params = {
  contact: {
    id: 1439,
    name: 'John Wick',
    telephone: '+31612345678',
    email: 'j.wick@example.com'
  }
}

const contactId = 1439;

transip.monitoringcontacts.update(params, contactId, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(response);
  }
});
