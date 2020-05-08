var transip = require('../../lib/transip.js')();

// Demo token
const demo_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImN3MiFSbDU2eDNoUnkjelM4YmdOIn0.eyJpc3MiOiJhcGkudHJhbnNpcC5ubCIsImF1ZCI6ImFwaS50cmFuc2lwLm5sIiwianRpIjoiY3cyIVJsNTZ4M2hSeSN6UzhiZ04iLCJpYXQiOjE1ODIyMDE1NTAsIm5iZiI6MTU4MjIwMTU1MCwiZXhwIjoyMTE4NzQ1NTUwLCJjaWQiOiI2MDQ0OSIsInJvIjpmYWxzZSwiZ2siOmZhbHNlLCJrdiI6dHJ1ZX0.fYBWV4O5WPXxGuWG-vcrFWqmRHBm9yp0PHiYh_oAWxWxCaZX2Rf6WJfc13AxEeZ67-lY0TA2kSaOCp0PggBb_MGj73t4cH8gdwDJzANVxkiPL1Saqiw2NgZ3IHASJnisUWNnZp8HnrhLLe5ficvb1D9WOUOItmFC2ZgfGObNhlL2y-AMNLT4X7oNgrNTGm-mespo0jD_qH9dK5_evSzS3K8o03gu6p19jxfsnIh8TIVRvNdluYC2wo4qDl5EW5BEZ8OSuJ121ncOT1oRpzXB0cVZ9e5_UVAEr9X3f26_Eomg52-PjrgcRJ_jPIUYbrlo06KjjX2h0fzMr21ZE023Gw';

const domainName = 'moreexamples.com';

var params = {
  domainName: domainName,
  authCode: "##########",
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


transip.domains.transfer(params, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(response);
  }
});
