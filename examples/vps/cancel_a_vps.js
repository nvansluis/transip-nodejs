// requires
var transip = require('../../lib/transip.js')();

// module variables
const config = require('../config.json');
const demo_token = config.demo_token;

const vpsName = 'transipdemo-vps4';

var params = {
  endTime: 'end',
};


transip.vps.cancel(params, vpsName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(response);
  }
});
