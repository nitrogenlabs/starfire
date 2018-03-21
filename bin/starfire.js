#!/usr/bin/env node

// Automatically compile gulp tasks files on the fly from ES6 to ES5
require('ts-node/register');


require("../src/cli").run(process.argv.slice(2));
