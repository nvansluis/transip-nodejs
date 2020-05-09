// requires
var transip = require('../../lib/transip.js')();

// module variables
const config = require('../config.json');
const demo_token = config.demo_token;

var params = {
  productName: 'vps-bladevps-x8',
  addons: [
    'vps-addon-1-extra-cpu-core',
  ],
  availabilityZone: 'ams0',
  description: 'example vps description',
  operatingSystem: 'ubuntu-18.04',
  installFlavour: 'installer',
  hostname: 'server01.example.com',
  username: 'linus',
  sshKeys: [
    'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDf2pxWX/yhUBDyk2LPhvRtI0LnVO8PyR5Zt6AHrnhtLGqK+8YG9EMlWbCCWrASR+Q1hFQG example',
  ],
  base64InstallText: '',
};


transip.vps.order(params, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(response);
  }
});
