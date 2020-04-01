/**
 * IP Service Class
 */
let qs = require('querystring');
let ipaddr = require('ipaddr.js');
let wrap = require('thunkify-wrap');
let request = wrap(require('request').get);
let logger = require('../util/log');

class IPService extends require('./NService') {
  /**
   * convert ip to v4
   * @return {String} ip v4, null if cant convert to ip v4
   */
  static convertToIPv4(ip) {
    // check ipv4
    if (ipaddr.IPv4.isValid(ip)) {
      return ip;
    }
    // check ipv6
    if (ipaddr.IPv6.isValid(ip)) {
      let ret = ipaddr.IPv6.parse(ip);
      if (ret.isIPv4MappedAddress()) {
        return ret.toIPv4Address().toString();
      }
    }
  }

  /**
   * get address from ip
   * @param  {String} ip - ip
   * @return {Object} address to the ip, eg. {"city":"广州市","country":"中国","county":"","ip":"223.252.218.173","la":"","lo":"","operators":"电信","otherinfo":"","province":"广东省"}
   */
  static * getAddress(ip) {
    // return null if not ip v4
    let ip4 = this.convertToIPv4(ip);
    if (!ip4) {
      return null;
    }
    // check address
    let conf = process.appConfig.ip;
    if (conf.disabled) {
      return {};
    }
    let opt = {
      url: conf.api + '?' + qs.stringify({
        ip: ip4,
        ver: '1.0',
        key: conf.appkey
      }),
      headers: {
        Referer: conf.referer
      }
    };
    // request to ip service
    let ret = yield request(opt);
    // 0-response 1-body
    try {
      ret = JSON.parse(ret[1]);
      if (ret.reason !== 'success') {
        logger.debug(
          '[%s.getAddress] get result from IP service failed',
          this.name, {ip: ip, ret: ret}
        );
      }
      return ret.result;
    } catch (ex) {
      logger.error(
        '[%s.getAddress] get result from IP service failed',
        this.name, {ip: ip, err: ex.stack}
      );
    }
  }
}

module.exports = IPService;
