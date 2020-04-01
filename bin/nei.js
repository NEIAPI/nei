/**
 * PM2 startup script
 *
 * Usage: node nei.js /^(test|online|develop)$/
 */
'use strict';
const pm2 = require('pm2');
const path = require('path');

const args = [].slice.call(process.argv, 2) || [];
const mode = args[0] || 'online';
const appName = `nei-${mode}`;
const script = path.join(__dirname, 'server.js');
pm2.connect(function () {
  pm2.list((err, list) => {
    if (list.some((task) => {
        return task.name === appName;
      })) {
      pm2.gracefulReload(appName, () => {
        process.exit(0);
      });
    } else {
      pm2.start({
        name: appName,
        script,
        args: `start -m ${mode}`,
        exec_mode: 'cluster',
        instances: 'max',
        max_memory_restart: '500M'
      }, function (err) {
        pm2.disconnect();   // Disconnect from PM2
        if (err) {
          throw err;
        }
      });
    }
  });
});
