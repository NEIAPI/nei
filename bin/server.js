/**
 * NEI Command Line
 */
'use strict';
const prog = require('commander');
const nei = require('../app');

// help information
prog.version(require('../package.json').version)
  .usage('node server.js <cmd> [options]');
// start up command
// node server.js -p 8082 -m test
prog.command('start')
  .description('start nei server')
  .usage('node server.js start [options]')
  .option('-p, --port <port>', 'server listen port, default is 8082')
  .option('-m, --mode <mode>', 'server run environment mode, you can use "develop" or "test" or "online", default environment mode is "develop"')
  .action(function (options) {
    nei.start(options);
  }).on('--help', function () {
  console.log('  Examples:');
  console.log('');
  console.log('    $ node server.js start -p 8082 -m develop');
  console.log('    $ node server.js start');
  console.log('');
});
// parse command line parameters
prog.parse(process.argv);
