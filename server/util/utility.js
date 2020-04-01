/**
 * shared/common utilities
 */
const pinyin = require('pinyin');
const crypto = require('crypto');
const Mime = require('mime');
const util = require('util');
const path = require('path');
const fs = require('fs');
const IllegalRequestError = require('../error/fe/IllegalRequestError');
const exec = require('child_process').exec;
const wrapper = require('thunkify-wrap');
const mcss = require('mcss');
const salt = process.appConfig && process.appConfig.salt;
const db = require('../../common/config/db.json');

/**
 * generate an unique seed
 * @return {String} unique seed
 */
let seed = exports.seed = (function () {
  let seed = +new Date();
  return function () {
    return String(seed++);
  };
})();

/**
 * generate a random string
 * @param {Number} length - length of the random string
 * @param {Boolean} onlyNum - whether the random string consists of only numbers
 * @param {Boolean} isComplex - whether the random string can contain complex chars
 * @return {String} generated random string
 */
let randString = exports.randString = (function () {
  let complexChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz!@#$%^&*()-=_+,./<>?;:[{}]\'"~`|\\';
  let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
  let numchars = '0123456789';
  return function (length, onlyNum, isComplex) {
    let strs = isComplex ? complexChars : chars;
    strs = onlyNum ? numchars : strs;
    length = length || 10;
    let ret = [];
    for (let i = 0, it; i < length; ++i) {
      it = Math.floor(Math.random() * strs.length);
      ret.push(strs.charAt(it));
    }
    return ret.join('');
  };
})();

/**
 * md5 encryption
 * @param {String} content - content to be encrpted
 * @return {String} encryption
 */
let md5 = exports.md5 = function (content) {
  return crypto
    .createHash('md5')
    .update(content)
    .digest('hex');
};

/**
 * generate an unique key
 * @return {String} unique key
 */
exports.uniqueKey = function () {
  let key = 'site' + seed() + randString(16);
  return md5(key);
};


/**
 * password encryption
 * @param {String} orgPwd - original password, might be encrypted by frontend
 * @param {String} pwdSalt - password salt
 * @param {String} username - user's username as part of the encryption content
 * @return {String} password with encryption, stored in database
 */
exports.encryptPwd = function (orgPwd, pwdSalt, username) {
  return md5(`${salt}${md5(orgPwd)}${pwdSalt}${username}`);
};

/**
 * convert strings from underscore to camel case format
 * e.g. abc_def_ghi -> abcDefGhi
 * @param {String} str - string to be converted
 * @return {String} string after conversion
 */
exports.toCamel = function (str) {
  return str.replace(/_([a-zA-Z])/g, function (all, $1) {
    return $1.toUpperCase();
  });
};

/**
 * format date to mysql DATETIME (i.e. yyyy-MM-dd HH:mm:ss.SSS)
 */
exports.format = (function () {
  let num = function (str, len = 2) {
    let d = len - String(str).length;
    return ('0').repeat(d) + str;
  };

  return function (time) {
    let date = typeof time === 'number' ? new Date(time) : time;
    return util.format('%s-%s-%s %s:%s:%s.%s',
      date.getFullYear(),
      num(date.getMonth() + 1),
      num(date.getDate()),
      num(date.getHours()),
      num(date.getMinutes()),
      num(date.getSeconds()),
      num(date.getMilliseconds(), 3)
    );
  };
})();

/**
 * convert strings from camel case to underscore format
 * e.g. abcDefGhi -> abc_def_ghi
 * @param {String} str - string to be converted
 * @return {String} string after conversion
 */
exports.toUnderline = function (str) {
  return str.replace(/[A-Z]/g, function (all) {
    return `_${all.toLowerCase()}`;
  });
};

/**
 * convert Chinese characters into pinyin
 * @param {String} str - string to be converted
 * @return {String} string after conversion
 */
let toPinyin = exports.toPinyin = function (str) {
  let arrs = pinyin(str, {
      style: pinyin.STYLE_NORMAL
    }) || [];
  let pyArr = arrs.map((arr) => arr[0]);
  return pyArr.join('\'');
};

/**
 * 判断拼音是否匹配
 *
 * 如拼音tian'xia'wo'you可匹配tixw和txwy，但不可匹配tinxwy
 *
 * @param  {String} pinyinStr - 拼音字符串
 * @param  {String} text - 待匹配字符串
 */
exports.isPinyinMatch = function (pinyinStr, text) {
  if (!pinyinStr || !text) {
    return false;
  }

  // 指向v值比较位置的指针
  let vCursor = 0;
  let pinyinArr = pinyinStr.split('\'');

  for (let pinyin of pinyinArr) {
    // 指向拼音值比较位置的指针
    let pCursor = 0;

    while (text[vCursor] && pinyin[pCursor] && text[vCursor] === pinyin[pCursor]) {
      pCursor++;
      vCursor++;
    }

    // v值已经完全匹配完了，则作为匹配成功处理
    if (vCursor >= text.length) {
      return true;
    }

    // 当前拼音一次匹配都没进行过，则作为匹配失败处理
    if (pCursor === 0) {
      return false;
    }
  }

  return false;
};

/**
 * 校验格式
 *
 * 传入数据，data为要校验数据，rules为规则表，其格式如下：
 *
 * {
 *     xxx字段名: {
 *         required: true,
 *         value: /\d{0,3}/
 *     }
 * }
 */
let validate = exports.validate = (function () {
  let rmap = {
    // 判断当前字段是否必须
    required: function (val, rval) {
      return !rval || val !== undefined;
    },
    // 判断值是否符合正则
    value: function (val, rval) {
      if (val === undefined) {
        return true;
      }

      if (!(rval instanceof RegExp)) {
        return false;
      }

      if (val instanceof Array) {
        for (let item of val) {
          if (!rval.test(String(item))) {
            return false;
          }
        }
        return true;
      }

      return rval.test(String(val));
    },
    // 判断值是否是数字
    isNumber: function (val, rval) {
      let flag = !rval || (typeof val === 'number' && !isNaN(val)) || /\d+/.test(val);
      if (flag) {
        return function (val) {
          return parseInt(val, 10);
        };
      } else {
        return flag;
      }
    },
    // 判断值是否是数组
    isArray: function (val, rval) {
      return !rval || val instanceof Array;
    },
    isDate: function (val, rval) {
      return rmap.isNumber(val);
    },
    // 判断值是否是布尔值
    isBoolean: function (val, rval) {
      let flag = !rval || typeof val === 'boolean' || /(true|false)/.test(val);
      if (flag) {
        return function (val) {
          return ('' + val).trim().toLowerCase() === 'true';
        };
      } else {
        return flag;
      }
    },
    // 判断子节点的规则
    rule: function (val, rval) {
      if (val instanceof Array) {
        let tmpArr = [];
        for (let item of val) {
          let ret = validate(item, rval);
          tmpArr.push(ret);
        }
        return function () {
          return tmpArr;
        };
      }

      let ret = validate(val, rval);
      return function () {
        return ret;
      };
    }
  };
  return function (data, rules) {
    // 对数据中每个字段进行验证
    let ret = {};
    let keys = Object.keys(rules);
    for (let key of keys) {
      let val = data[key];
      let rule = rules[key];
      if (val === undefined) {
        // 当数据不带有对应字段时
        if (!rule.required) {
          continue;
        } else {
          throw new IllegalRequestError(`missing value for required field ${key}`);
        }
      }

      ret[key] = val;
      // 对每个字段的逐条规则进行验证
      let rkeys = Object.keys(rule);
      for (let rkey of rkeys) {
        let rval = rule[rkey];
        let flag = rmap[rkey](val, rval);
        if (!flag) {
          throw new IllegalRequestError(`invalid value for ${key}`);
        }
        if (typeof flag === 'function') {
          // 需要做值转换
          ret[key] = flag(ret[key]);
        }
      }
    }
    return ret;
  };
})();

/**
 * filter object properties
 * @param {Object} obj - object to be filtered
 * @param {Array} props - object properties to be filtered
 * @return {Object} object with filtered properties
 *
 * E.g. filterObj({a:1, b:2, c:3}, ['a', 'b']) -> {a:1, b:2}
 */
exports.filterObj = function (obj, props) {
  if (!obj) {
    return {};
  }
  if (!props) {
    return obj;
  }
  props = !Array.isArray(props) ? [props] : props;
  let result = {};
  props.forEach((propName) => {
    if (obj.hasOwnProperty(propName)) {
      result[propName] = obj[propName];
      delete obj[propName];
    }
  });
  return result;
};

/**
 * filter array
 * @param {Array} arr - object to be filtered
 * @param {Function} predicate
 * @param [Boolean] singleton - flat to return single element
 * @return {Array}
 *
 */
exports.filterArr = function (arr, predicate, singleton) {
  let ret = (arr || []).filter(predicate);
  if (singleton) {
    ret = ret[0];
  }
  return ret;
};

/**
 * get object values
 * @param {Object} obj
 * @return {Array}
 */
exports.values = function (obj) {
  let result = [];
  for (let it in obj) {
    if (obj.hasOwnProperty(it)) {
      result.push(obj[it]);
    }
  }
  return result;
};

/**
 * check if an object is empty
 * @param {String} str - string to be converted
 * @return {String} string after conversion
 */
let isEmptyObj = exports.isEmptyObj = function (obj) {
  if (!obj) {
    return false;
  }
  return obj.constructor === Object && Object.keys(obj).length === 0;
};

/**
 * Check for plain object.
 * @param {Mixed} val
 * @return {Boolean}
 */

exports.isObject = function (val) {
  return Object == val.constructor;
};

exports.toolKeyType = {
  PROJECT: 'project',
  PROGROUP: 'progroup',
  SPECIFICATION: 'specification'
};

/**
 * get toolkey
 * @param {Number} id - resource id
 * @param {Number} type - resource type
 * @return {String} key
 */
exports.getToolKey = function (id, type = 'project') {
  return md5(`${randString(32, false, true)}_${type}_${id}`);
};

/**
 * add in or remove id from the given string
 * @param {Number} id - resource id
 * @return {String} key
 */
exports.strPad = function (str, id, opt = 'remove') {
  let result = str.match(/\d+/g) || [];
  let index = result.indexOf(String(id));
  if (index >= 0) {
    result.splice(index, 1);
  }
  if (opt === 'add') {
    result.unshift(id);
  }
  return result.join(',');
};

/**
 * check if two arrays have same values
 * @param {Array Number} arr1 - first array to be compared
 * @param {Array Number} arr2 - second array to be compared
 * @return {String} key
 */
exports.isArraySameValues = function (arr1 = [], arr2 = []) {
  let [arr1Cp, arr2Cp] = [[...arr1], [...arr2]];
  return arr1Cp.sort().join(',') === arr2Cp.sort().join(',');
};

/**
 * Creates an array of array values not included in the other given arrays
 * @param  {Array Number} arr
 * @param  {Array Number} values
 * @return {Array Number}
 */
exports.diff = function (arr, values) {
  let result = [];
  (arr || []).forEach((item) => {
    if (!values.includes(item)) {
      result.push(item);
    }
  });
  return result;
};

/**
 * Creates a duplicate-free version of an array
 * @param {Array} array
 * @return {Array}
 */
let uniq = exports.uniq = function (arr) {
  return (arr || []).filter(function (item, pos) {
    return arr.indexOf(item) === pos;
  });
};

/**
 * Check if an array has duplicate values
 * @param {Array} array
 * @return {Array}
 */
exports.hasDuplicates = function (arr) {
  return (new Set(arr)).size !== arr.length;
};

/**
 * clone an object
 * @param {Object} obj
 * @return {Object}
 */
exports.clone = function (obj) {
  return JSON.parse(
    JSON.stringify(obj)
  );
};

/**
 * rename field name
 * @param {Object} obj
 * @param {Object} map
 * @return {Object}
 */
exports.rename = function (obj, map = {}) {
  Object.keys(map).forEach((key) => {
    if (obj.hasOwnProperty(key)) {
      let val = obj[key];
      delete obj[key];
      obj[map[key]] = val;
    }
  });
  return obj;
};

/**
 * add pinyin to the model per condition
 * @param {Object} model
 * @param {db model} theModel
 * @param {Array String} fields array
 * @return {Void}
 */
exports.addPinyin = function (model, theModel, fieldsArr) {
  (fieldsArr || []).forEach((field) => {
    let fieldPinyin = `${field}Pinyin`;
    if ((model || {}).hasOwnProperty(field) && theModel.getField(fieldPinyin)) {
      model[fieldPinyin] = toPinyin(model[field]);
    }
  });
};

/**
 * sort the array given the order list
 * @param {Array} arr - array to be sorted
 * @param {Array String} orderListString - order list string e.g.['12,34,56', '22']
 * @return {Array}
 */
exports.sortWithOrderList = function (arr, orderList) {
  if (!Array.isArray(orderList)) {
    orderList = [orderList];
  }
  let orderString = orderList.join(',');
  let orderArr = orderString.match(/\d+/g) || [];
  orderArr = uniq(orderArr);
  let sortedArr = [];
  let sortedIds = [];
  orderArr.forEach((id) => {
    let idInt = parseInt(id);
    let toBeSortedElem = (arr.filter((elem) => {
      return elem.id === idInt;
    }))[0];
    if (toBeSortedElem) {
      sortedArr.push(toBeSortedElem);
      sortedIds.push(idInt);
    }
  });

  sortedArr = sortedArr.concat(arr.filter((elem) => {
    return !sortedIds.includes(elem.id);
  }));

  return sortedArr;
};

/**
 * escape html entities including:
 *     single quote '   => &#39;
 *     double quote "   => &quot;
 *     ampersand &      => &amp;
 *     less than <      => &lt;
 *     greateer than >  => &gt;
 *
 * @param  {String|Array|Object} unsafe - data the be escaped
 * @return {String|Array|Object}
 */
let escapeHtml = exports.escapeHtml = function (unsafe) {
  if (Array.isArray(unsafe)) {
    unsafe.forEach((it, index, ctx) => {
      ctx[index] = escapeHtml(it);
    });
    return unsafe;
  } else if (Object.prototype.toString.call(unsafe) === '[object Object]') {
    Object.keys(unsafe).forEach((key) => {
      unsafe[key] = escapeHtml(unsafe[key]);
    });
    return unsafe;
  }

  if (typeof unsafe !== 'string') {
    return unsafe;
  }

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;')
    .replace(/>/g, '&gt;');
};

/**
 * check if object contains the value in the given attribute
 *
 * @param  {Object} obj - object to be checked
 * @param  {Array} String - array of attributes to check
 * @return {Boolean}
 */
exports.contains = function (obj, attributes, val) {
  return (attributes || []).some((att) => {
    return obj[att] === val;
  });
};

exports.translateParams = function (obj, paramArr) {
  for (let param of paramArr) {
    let val = obj[param];
    if (val === '') {
      obj[param] = [];
    } else if (typeof val !== 'undefined') {
      if (Array.isArray(obj[param])) {
        return;
      }
      obj[param] = val.split(',').map((item) => {
        return parseInt(item);
      });
    }
  }
};

let getFileInfo = exports.getFileInfo = function (filePath, callback) {
  let mime = Mime.lookup(filePath).trim();
  exec(`file ${filePath}`, {encoding: 'utf8'}, function (err, info) {
    // info format: path type
    info = (info || '').replace(/^[^\s]+/, '');
    let isText = /text|empty/.test(info);
    // get specific mime for text file
    if (isText) {
      mime = mime.replace(
        /[^\/]+(\/[^\/]+)/,
        (all, $2) => {
          return `text${$2}`;
        }
      );
    }
    callback(err, {mime, isText});
  });
};

let unzip = exports.unzip = function*(filePath, rootPath) {
  try {
    fs.accessSync(rootPath);
  } catch (ex) {
    fs.mkdirSync(rootPath);
  }
  let data = fs.readFileSync(filePath);
  let zip = new require('jszip')();
  let content = yield zip.loadAsync(data);
  for (let key of Object.keys(content.files)) {
    let item = content.files[key];
    if (item.dir) {
      try {
        fs.accessSync(path.join(rootPath, item.name));
      } catch (ex) {
        fs.mkdirSync(path.join(rootPath, item.name));
      }
    } else {
      let meta = yield item.async('nodebuffer');
      fs.writeFileSync(path.join(rootPath, item.name), meta);
    }
  }
};

let buildDirTree = exports.buildDirTree = function (zipdocPath, callback) {
  let result = {
    files: [],
    dirs: []
  };

  let counter;
  fs.readdir(zipdocPath, function (err, subs) {
    counter = subs && subs.length;
    if (!counter) {
      callback(null, result);
    }
    subs.forEach(function (fileName) {
      let filePath = path.join(zipdocPath, fileName);
      fs.stat(filePath, function (err, stat) {
        if (stat.isFile()) {
          getFileInfo(filePath, function (err, info) {
            fs.readFile(filePath, {encoding: info.isText ? 'utf8' : null}, function (err, content) {
              result.files.push({
                name: fileName,
                path: filePath,
                type: 'file',
                isDir: false,
                content: content,
                mime: info.mime,
                isText: info.isText,
                parent: zipdocPath
              });
              if (!--counter) {
                callback(null, result);
              }
            });
          });
        }
        if (stat.isDirectory()) {
          result.dirs = result.dirs.concat({
            name: fileName,
            path: filePath,
            type: 'directory',
            isDir: true,
            sub: [],
            parent: zipdocPath
          });
          buildDirTree(filePath, function (err, res) {
            result.files = result.files.concat(res.files);

            let dirs = res.dirs.map(function (item) {
              return {
                name: item.name,
                path: item.path,
                type: 'directory',
                isDir: true,
                sub: [],
                parent: item.parent
              };
            });
            result.dirs = result.dirs.concat(dirs);
            if (!--counter) {
              callback(null, result);
            }
          });
        }
      });
    });
  });
};

/**
 * get zip structure
 *
 * [{
 *    "name":"a",
 *      "type":"directory",
 *      "isDir": true,
 *      "sub":[
 *          {
 *              "name": "a1",
 *              "type": "file",
 *              "path": "/a/a1",
 *              "mime": "text/plain",
 *              "isText": true,
 *              "isDir": false,
 *              "content": "xxxxxx"
 *          },
 *          {
 *              "name": "a1",
 *              "type": "file",
 *              "path": "/a/a1",
 *              "mime": "image/gif",
 *              "isText": fasle,
 *              "isDir": false,
 *              "content": Buffer Object
 *          }, ... ]
 *  }, ...]
 */
exports.getZipMap = function*(zipPath) {
  fs.accessSync(zipPath);
  let {dir: pdir, name: pname} = path.parse(zipPath);
  let zipdocPath = path.join(pdir, pname);
  yield unzip(zipPath, zipdocPath);
  fs.unlinkSync(zipPath); // remove the zip file
  // build tree structure
  let ret = yield wrapper(buildDirTree)(zipdocPath);
  let fileMap = {};
  ([].concat(ret.files, ret.dirs)).forEach((item) => {
    fileMap[item.path] = item;
  });
  Object.keys(fileMap).forEach(function (filePath) {
    let file = fileMap[filePath];
    let parentPath = file.parent;
    if (parentPath in fileMap) {
      fileMap[parentPath].sub.push(file);
    } else if (parentPath === zipdocPath) {
      fileMap[parentPath] = {};
      fileMap[parentPath].sub = [file];
    }
  });
  return {
    fileList: fileMap[zipdocPath].sub,
    zipPath: zipdocPath
  };
};

exports.relAndFullUrls = function (url, domain) {
  return [url, domain + url];
};

exports.toArray = function (arr) {
  if (!Array.isArray(arr)) {
    return [arr];
  }
  return arr;
};


exports.mergeDTs = function (dtArr) {
  let hash = {};
  (dtArr || []).forEach(it => {
    /* it: datatype map for each project. e.g.
     *      {
     *          10000: {
     *              name: 'String'
     *          },
     *          10001: {
     *              name: 'Boolean'
     *          }
     *      }
     */
    Object.keys(it).forEach(did => {
      if (!hash[did]) {
        hash[did] = it[did];
      }
    });
  });
  return hash;
};

/**
 * convert model to json objet
 *
 * @protected
 * @param  {Model|Array} model - model object
 * @return {Object|Array} json object
 */
let _unwrap = exports._unwrap = function (model) {
  if (model == null) {
    return model;
  }
  // convert array object
  if (Array.isArray(model)) {
    let ret = [];
    model.forEach((it) => {
      ret.push(_unwrap(it));
    });
    return ret;
  }

  if (model == null || isEmptyObj(model)) {
    return model;
  }

  Object.keys(model).forEach(key => {
    let val = model[key];
    model[key] = typeof val === 'object' ? _unwrap(val) : val;
  });

  if (model.toViewModel) {
    model = model.toViewModel();
  }
  if (model.toNObject) {
    model = model.toNObject();
  }
  return model;
};

exports.downloadFile = (function () {
  return wrapper(function (file, url, callback) {
    let destination = fs.createWriteStream(file);
    request(url)
      .pipe(destination)
      .on('error', function (error) {
        fs.unlink(file);
        callback(error, '');
      });
    destination.on('finish', function () {
      destination.close();
      callback(null, 'success');
    });
  });
})();

exports.translateMcss = (function () {
  return wrapper(function (filename, callback) {
    let basename = path.basename(filename, '.mcss');
    if (basename.startsWith('_')) {
      return;
    }
    let file = `${path.dirname(filename)}/${basename}.css`;
    let instance = mcss({
      filename: filename,
      sourceMap: true,
      dest: file
    });
    instance.translate().done((text) => {
      fs.writeFileSync(file, text);
      callback(null, text);
    }).fail((error) => {
      callback(error, null);
    });
  });
})();

/**
 * 将模板字符串中的占位符替换成值，如果值的个数多于占位符，则忽略多余的值，只支持 %s 占位符。该方法和 Node.js 的 util.format 有所区别
 *
 * @param  {String} template - 包含占位符的字符串
 * @param  {Array} values - 值的数组
 * @return {String}  替换完的字符串
 */
exports.formatString = function (template, values) {
  return template.replace(/%s/g, () => values.shift());
};

exports.jsonSchemaToParams = function (schema, datatypes, parentId, parentType) {
  const dataTypeMap = {
    string: db.MDL_SYS_STRING,
    boolean: db.MDL_SYS_BOOLEAN,
    number: db.MDL_SYS_NUMBER
  };

  const dataTypeReverseMap = {
    [db.MDL_SYS_STRING]: 'string',
    [db.MDL_SYS_BOOLEAN]: 'boolean',
    [db.MDL_SYS_NUMBER]: 'number'
  };

  const objDts = datatypes.filter(dt => dt.format === db.MDL_FMT_HASH && dt.name);

  const checkIfObjKeySame = function (schemaProperties, dtParams) {
    const targetKeys = Object.keys(schemaProperties || {});
    if (
      targetKeys.length === 0
      || targetKeys.length !== dtParams.length
    ) {
      return false;
    }
    for (let i = 0; i < dtParams.length; i++) {
      const findTargetKeyIndex = targetKeys.indexOf(dtParams[i].name);
      if (
        findTargetKeyIndex < 0
        || dataTypeReverseMap[dtParams[i].type] !== schemaProperties[targetKeys[findTargetKeyIndex]].type
      ) {
        return false;
      }
    }
    return true;
  };

  const findExistingDatatype = function (target, dts) {
    for (let i = 0; i < dts.length; i++) {
      if (checkIfObjKeySame(target.properties, dts[i].params)) {
        return dts[i];
      }
    }
    return null;
  };

  const getRequiredMapFromSchema = function (schema) {
    const requiredMap = {};
    if (schema.required && Array.isArray(schema.required) && schema.required.length > 0) {
      for (let i = 0; i < schema.required.length; i++) {
        requiredMap[schema.required[i]] = true;
      }
    }
    return requiredMap;
  };

  const toParams = function (key, schema, isRequired) {
    if (dataTypeMap[schema.type]) {
      // basic type
      return {
        isArray: 0,
        isObject: 0,
        // adding: true,
        name: key,
        type: dataTypeMap[schema.type],
        required: isRequired ? 1 : 0
      };
    }
    if (schema.type === 'object') {
      const existingDatatype = findExistingDatatype(schema, objDts);
      if (existingDatatype) {
        return {
          isArray: 0,
          isObject: 0,
          name: key,
          adding: true,
          type: existingDatatype.id,
          required: isRequired ? 1 : 0
        };
      }
      const keys = Object.keys(schema.properties || {});
      const requiredMap = getRequiredMapFromSchema(schema);
      const params = keys.map(k => toParams(k, schema.properties[k], requiredMap[k] === true));
      return {
        isArray: 0,
        isObject: 1,
        imports: [],
        // adding: true,
        name: key,
        type: db.MDL_SYS_OBJECT,
        params: params,
        required: isRequired ? 1 : 0
      };
    }
    if (schema.type === 'array') {
      return Object.assign(toParams(key, schema.items, isRequired), {isArray: 1});
    }
  };

  if (schema.type !== 'object') return [];
  const keys = Object.keys(schema.properties);
  const requiredMap = getRequiredMapFromSchema(schema);
  const params = [];
  for (let i = 0; i < keys.length; i++) {
    params.push(
      Object.assign(
        toParams(keys[i], schema.properties[keys[i]], requiredMap[keys[i]] === true),
        // { parentType: parentType, parentId: parentId }
        {}
      )
    );
  }
  return params;
};
