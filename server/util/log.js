/**
 * logger api
 */
let path = require('path');
let util = require('util');
let winston = require('winston');
let fs = require('fs');
let config = process.appConfig;
let options = config.logger;
// DEFAULT config
const DEFAULT = {
  json: !1,
  timestamp: function () {
    let time = new Date;
    return util.format(
      '%s-%s-%s %s:%s:%s.%s',
      time.getFullYear(),
      String('0' + (time.getMonth() + 1)).slice(-2),
      String('0' + time.getDate()).slice(-2),
      String('0' + time.getHours()).slice(-2),
      String('0' + time.getMinutes()).slice(-2),
      String('0' + time.getSeconds()).slice(-2),
      String('00' + time.getMilliseconds()).slice(-3)
    );
  },
  formatter: function (options) {
    let arr = [util.format(
      '[%s] [%s] - %s',
      options.level.toUpperCase().charAt(0),
      options.timestamp(),
      options.message || ''
    )];
    if (options.meta && Object.keys(options.meta).length > 0) {
      arr.push(util.format(
        'meta -> %s',
        JSON.stringify(
          options.meta, function (key, value) {
            if (value === undefined) {
              return '__NOT_DEFINED__';
            }
            return value;
          }
        ))
      );
    }
    return arr.join('\n');
  }
};

let appRoot = config.appRoot || path.join(__dirname, '../../');
let logRoot = path.join(appRoot, options.root);
try {
  fs.accessSync(logRoot);
} catch (err) {
  fs.mkdirSync(logRoot);
}
// export Logger instance
module.exports = new (winston.Logger)({
  level: options.level || 'debug',
  transports: [
    new winston.transports.Console(DEFAULT),
    new winston.transports.File(
      Object.assign({}, DEFAULT, {
        level: 'warn',
        filename: path.join(
          logRoot,
          '/nei.error.log'
        )
      })
    ),
    new (require('winston-daily-rotate-file'))(
      Object.assign({}, DEFAULT, {
        datePattern: '.yyyyMMdd.log',
        filename: path.join(
          logRoot,
          '/nei'
        )
      })
    )
  ],
  exceptionHandlers: [
    new winston.transports.File(
      Object.assign({}, DEFAULT, {
        filename: path.join(
          logRoot,
          '/nei.exception.log'
        )
      })
    )
  ],
  exitOnError: !1
});
