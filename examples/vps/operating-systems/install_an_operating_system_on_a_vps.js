// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

const vpsName = 'transipdemo-vps4';

var params = {
  operatingSystemName: 'ubuntu-20.04',
  hostname: '',
  installFlavour: 'cloudinit',
  username: 'bob',
  sshKeys: [
    'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDf2pxWX/yhUBDyk2LPhvRtI0LnVO8PyR5Zt6AHrnhtLGqK+8YG9EMlWbCCWrASR+Q1hFQG example',
  ],
  base64InstallText: '',
};

transip.vps.operatingsystems.install(params, vpsName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(JSON.stringify(response, null, 4));
  }
});
