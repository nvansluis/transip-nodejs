TransIP REST API for Node.js
============================

This repository contains the open source Node.js client for the TransIP REST API v6.1.

[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE) [![npm version](https://img.shields.io/npm/v/transip-nodejs.svg?style=flat)](https://www.npmjs.com/package/transip-nodejs)

Requirements
------------
- Go to https://www.transip.nl/cp/account/api/
- Create a new Key Pair.
- Save the private key in a file. e.g. private_key.txt.

Installation
------------

`npm install transip-nodejs`

Usage
-----

We have put some self-explanatory examples in the *examples* directory, but here is a quick breakdown on how it works.
Let's go ahead and initialize the library first. Don't forget to add your private key to private_key.txt and replace `<YOUR_USERNAME>` with your own username.

CommonJS require syntax:

```javascript
var fs = require('fs');

const login = '<YOUR_USERNAME>';
const label = 'accesstoken1';

const privateKey = fs.readFileSync('./private_key.txt').toString()

var transip = require('transip-nodejs')(privateKey);

var params = {
  login: login,
  label: label,
  read_only: false,
  experation_time: '30 minutes',
  global_key: false
};

transip.accesstoken.create(params, function(err,response) {
  if (err) {
    return console.log(err);
  }

  if (response.error) {
    return console.log(response);
  }
  else {
    const token = response.token;

    transip.domains.list(token, function(err,response) {
      if (err) {
        return console.log(err);
      }
      else {
        console.log(response);
      }
    });
  }
});
```
