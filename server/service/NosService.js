/**
 * Nos Service Class
 */

const wrap = require('thunkify-wrap');
const log = require('../util/log');
const crypto = require('crypto');
const fs = require('fs');
const request = wrap(require('request'));
const NotFound = require('../error/fe/NotFoundError');
const qs = require('querystring');

class NosService extends require('./NService') {
  constructor(options = {}) {
    super();
    this.host = options.host;
    this.port = options.port;

    this.accessSecret = options.key || null;
    this.accessId = options.id || null;
    this.bucket = options.bucket || '';
  }

  /**
   * upload file
   * @param  {String} filePath - file path
   * @param  {String} key - key
   * @return {Void}
   */
  * upload(filePath, key) {

  }

  /**
   * download file
   * @param  {String} filePath - download destination
   * @param  {String} key - key
   * @return {Void}
   */
  * download(filePath, url) {

  }

  /**
   * remove file
   * @param  {String} key - nos key
   * @return {Void}
   */
  * remove(key) {

  }

  /**
   * get request details. e.g. url, headers, method, timeout
   * @param  {Object} options - {requestMethod, key, contentType}
   * @return {Object}
   */
  _getRequestDetails(options) {

  }

  /**
   * get encrypted auth key
   * @private
   * @param  {String} canonicalizedStr - canonicalized string to be encrypted
   * @return {String} encypted auth key
   */
  _getAuth(canonicalizedStr) {

  }

  /**
   * get upload url
   * @private
   * @param  {String} key - nos key
   * @return {String} return url
   */
  getUrl(key) {

  }

  /**
   * get token
   * @private
   * @param  {String} key - nos key
   * @return {String}
   */
  _getToken(key) {

  }
}

// export NosService class
module.exports = NosService;
