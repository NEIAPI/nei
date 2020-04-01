/**
 * Startup NEI Server
 */
exports.start = function (options) {
  let opt = {
    port: 8082,
    mode: 'develop',
  };
  Object.assign(opt, options);
  opt.source = opt.mode === 'develop';
  // init config
  process.appConfig = Object.assign(
    {
      appRoot: __dirname,
      webRoot: '/public/'
    },
    require(`./server/config/${opt.mode}.js`),
    {
      mode: opt.mode
    }
  );
  // create a server
  let app = new (require('./server/arch/NServer'))({
    port: opt.port,
    view: {
      resolver: 'EJSResolver'
    },
    roots: {
      'appRoot': __dirname,
      'webRoot': '/public/',
      'viewRoot': opt.source ? '/view/' : '/template/',
      'webPath': '/server/controller/web/',
      'apiPath': '/server/controller/api/',
      'filterPath': '/server/filter/',
      'uploadRoot': './uploads',
      'downloadRoot': './downloads'
    },
    routes: require('./server/config/router'),
    filters: require('./server/config/filter')
  });

  // start up server
  app.start();
};
