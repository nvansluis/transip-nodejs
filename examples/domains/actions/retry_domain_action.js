// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

const domainName = 'transipdemo.net';

var params = {
  authCode: '',
  contacts: [
    {
      type: 'registrant',
      firstName: 'John',
      lastName: 'Doe',
      companyName: 'Example B.V.',
      companyKvk: '83057825',
      companyType: 'BV',
      street: 'Easy street',
      number: '12',
      postalCode: '1337 XD',
      city: 'Leiden',
      phoneNumber: '+31 715241919',
      faxNumber: '+31 715241919',
      email: 'example@example.com',
      country: 'nl'
    },
    {
      type: 'administrative',
      firstName: 'John',
      lastName: 'Doe',
      companyName: 'Example B.V.',
      companyKvk: '83057825',
      companyType: 'BV',
      street: 'Easy street',
      number: '12',
      postalCode: '1337 XD',
      city: 'Leiden',
      phoneNumber: '+31 715241919',
      faxNumber: '+31 715241919',
      email: 'example@example.com',
      country: 'nl'
  },
  {
      type: 'technical',
      firstName: 'John',
      lastName: 'Doe',
      companyName: 'Example B.V.',
      companyKvk: '83057825',
      companyType: 'BV',
      street: 'Easy street',
      number: '12',
      postalCode: '1337 XD',
      city: 'Leiden',
      phoneNumber: '+31 715241919',
      faxNumber: '+31 715241919',
      email: 'example@example.com',
      country: 'nl'
    }
  ],
  nameservers: [
    {
      hostname: 'ns1.example.com',
      ipv4: '',
      ipv6: '',
    },
    {
      hostname: 'ns2.example.com',
      ipv4: '',
      ipv6: '',
    }
  ],
  dnsEntries: [
    {
      name: 'www',
      expire: '86400',
      type: 'A',
      content: '127.0.0.1'
    }
  ]
};

transip.domains.actions.retry(params, domainName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(response);
  }
});
