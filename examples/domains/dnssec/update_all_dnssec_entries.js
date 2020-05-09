// requires
var transip = require('../../../lib/transip.js')();

// module variables
const config = require('../../config.json');
const demo_token = config.demo_token;

const domainName = 'transipdemo.net';

var params = {
  dnsSecEntries: [
    {
      keyTag: 67239,
      flags: 1,
      algorithm: 8,
      publicKey: 'AwEAAc31XDE3QWphFz6CR77Hp3ZjDRx7zqe1AXx1QMvqFKzrEKrX4oj2nv8zDquCotbQ1ObHI4KGLRf3ycaq0fYslXFJ1JxLxJUl/lpGvE8OkqdhGW3vj3YS9Mlbf0yYC2bNUY875UgDNRLqWtVSEXO/PCcqr3RIzpngu+6JF/1bfQB7ituFHxoanhAiWOpc24ZAnrhmyIsDwyy1k0iyvVTSyPugnYD/bF7CR7ObQCiuucjwCkSBHJ4gcihHvyPDU/DlsSJeEO/G31zFxzXwHjr3h3mdJE4mQuceS11e5/c9hht6rUL0PEGve1Ygknz+0ruAinlhFYnny2uxES5M9r0FIM='
    }
  ]
};


transip.domains.dnssec.update(params, domainName, demo_token, function(err,response) {
  if (err) {
    return console.log(err);
  }
  else {
    console.log(response);
  }
});
