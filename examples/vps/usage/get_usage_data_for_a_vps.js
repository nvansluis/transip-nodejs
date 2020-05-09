// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

const vpsName = 'transipdemo-vps4';

var params = {
  types: "cpu,disk,network",
  dateTimeStart: 1500538995,
  dateTimeEnd: 1500542619,
};

transip.vps.usage.get(params, vpsName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(JSON.stringify(response, null, 4));
  }
});
