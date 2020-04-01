/**
 * history format helper
 */
let dbMap = require('../../../common').db;
let sqlOpt = {noTransaction: true};
let userDao = new (require('../../dao/UserDao'))(sqlOpt);
let projectDao = new (require('../../dao/ProjectDao'))(sqlOpt);
let progroupDao = new (require('../../dao/ProGroupDao'))(sqlOpt);
let datatypeDao = new (require('../../dao/DataTypeDao'))(sqlOpt);
let bisgroupDao = new (require('../../dao/BisGroupDao'))(sqlOpt);
let specDao = new (require('../../dao/SpecificationDao'))(sqlOpt);
let specDirectoryDao = new (require('../../dao/SpecificationDirectoryDao'))(sqlOpt);
let progUserDao = new (require('../../dao/ProGroupUserDao'))(sqlOpt);
let resHistoryDao = new (require('../../dao/ResourceHistoryDao'))(sqlOpt);
let resVersionDao = new (require('../../dao/ResourceVersionDao'))(sqlOpt);
let parameterDao = new (require('../../dao/ParamDataTypeDao'))(sqlOpt);
let interfaceDao = new (require('../../dao/InterfaceDao'))(sqlOpt);
let rpcDao = new (require('../../dao/RpcDao'))(sqlOpt);
let wordDao = new (require('../../dao/WordDao'))(sqlOpt);
let templateData = new (require('../../dao/TemplateDao'))(sqlOpt);
let _ = require('../../util/utility');

const SERVICE_NAME = {
  [dbMap.RES_TYP_INTERFACE]: 'HTTP接口',
  [dbMap.RES_TYP_RPC]: 'Rpc接口',
  [dbMap.RES_TYP_DATATYPE]: '数据模型',
  [dbMap.RES_TYP_CONSTRAINT]: '规则函数',
  [dbMap.RES_TYP_TEMPLATE]: '页面模板',
  [dbMap.RES_TYP_CLIENT]: '客户端',
  [dbMap.RES_TYP_WEBVIEW]: '页面',
  [dbMap.RES_TYP_WORD]: '参数字典',
};
const FORMAT_NAME = {
  [dbMap.MDL_FMT_BOOLEAN]: '布尔值',
  [dbMap.MDL_FMT_ENUM]: '枚举值',
  [dbMap.MDL_FMT_ARRAY]: '数组值',
  [dbMap.MDL_FMT_STRING]: '字符值',
  [dbMap.MDL_FMT_NUMBER]: '数值',
  [dbMap.MDL_FMT_FILE]: '文件值',
};
const HASH_FORMAT_NAME = {
  [dbMap.RES_TYP_DATATYPE]: '属性',
  [dbMap.RES_TYP_INTERFACE]: '字段',
  [dbMap.RES_TYP_RPC]: '字段'
};
const FORMAT_FIELD = {
  [dbMap.PAM_TYP_INPUT]: 'reqFormat',
  [dbMap.PAM_TYP_OUTPUT]: 'resFormat',
  [dbMap.PAM_TYP_ATTRIBUTE]: 'format',
  [dbMap.PAM_TYP_RPC_INPUT]: 'reqFormat',
  [dbMap.PAM_TYP_RPC_OUTPUT]: 'resFormat',
};
const DAO_MAP = {
  [dbMap.RES_TYP_INTERFACE]: interfaceDao,
  [dbMap.RES_TYP_RPC]: rpcDao,
  [dbMap.RES_TYP_DATATYPE]: datatypeDao,
  [dbMap.RES_TYP_WORD]: wordDao,
};
const specTypeMap = {
  [dbMap.CMN_TYP_WEB]: 'WEB',
  [dbMap.CMN_TYP_AOS]: 'AOS',
  [dbMap.CMN_TYP_IOS]: 'IOS',
  [dbMap.CMN_TYP_TEST]: 'TEST'
};

const REQUIRED_VAL_TO_HUMAN_TEXT = {
  required: {
    [dbMap.CMN_BOL_YES]: '是',
    [dbMap.CMN_BOL_NO]: '否'
  },
  ignored: {
    [dbMap.CMN_BOL_YES]: '不可见',
    [dbMap.CMN_BOL_NO]: '可见'
  },
  showPublicList: {
    [dbMap.CMN_BOL_YES]: '显示',
    [dbMap.CMN_BOL_NO]: '不显示'
  },
  apiAudit: {
    [dbMap.CMN_BOL_YES]: '需要',
    [dbMap.CMN_BOL_NO]: '不需要'
  },
  apiUpdateControl: {
    [dbMap.CMN_BOL_YES]: '需要',
    [dbMap.CMN_BOL_NO]: '不需要'
  },
  resParamRequired: {
    [dbMap.CMN_BOL_YES]: '不可以',
    [dbMap.CMN_BOL_NO]: '可以'
  },
  useWordStock: {
    [dbMap.CMN_BOL_YES]: '开启',
    [dbMap.CMN_BOL_NO]: '关闭'
  },
  wordForbidStatus: {
    [dbMap.WORD_STATUS_NORMAL]: '启用',
    [dbMap.WORD_STATUS_FORBID]: '禁用'
  }
};

const userRoleMap = progUserDao._semanticRoleMap;

function _toFormat() {
  const paramFormatMap = {
    [dbMap.MDL_FMT_HASH]: '哈希表',
    [dbMap.MDL_FMT_ENUM]: '枚举类型',
    [dbMap.MDL_FMT_ARRAY]: '数组',
    [dbMap.MDL_FMT_STRING]: '字符串',
    [dbMap.MDL_FMT_NUMBER]: '数值型',
    [dbMap.MDL_FMT_BOOLEAN]: '布尔型',
    [dbMap.MDL_FMT_FILE]: '文件类型',
  };
  return (val) => paramFormatMap[val];
}

function _toSpecEngine() {
  const engineMap = {
    [dbMap.SPC_ENG_NONE]: '无',
    [dbMap.SPC_ENG_EJS]: 'EJS',
    [dbMap.SPC_ENG_SWIG]: 'Swig',
    [dbMap.SPC_ENG_FREEMARK]: 'Freemarker',
    [dbMap.SPC_ENG_VELOCITY]: 'Velocity',
    [dbMap.SPC_ENG_SMARTY]: 'Smarty'
  };

  return val => engineMap[val];
}

function _toSpecLanguage() {
  const languageMap = {
    [dbMap.SPC_LNG_NODE]: 'Node.js',
    [dbMap.SPC_LNG_JAVA]: 'Java',
    [dbMap.SPC_LNG_PHP]: 'PHP',
    [dbMap.SPC_LNG_UNKNOWN]: '其他'
  };

  return val => languageMap[val];
}

function* _toSpec(sid) {
  if (sid === 0) { // clear spec setting
    return '未绑定';
  }
  let spec = yield specDao.find(sid);
  return spec.name;
}

function _toStatus() {
  const statusMap = {
    [dbMap.STATUS_SYS_UNDERDEVELOPMENT]: '未开始',
    [dbMap.STATUS_SYS_AUDITING]: '审核中',
    [dbMap.STATUS_SYS_AUDIT_FAILED]: '审核失败',
    [dbMap.STATUS_SYS_DEVELOPING]: '开发中',
    [dbMap.STATUS_SYS_TESTING]: '测试中',
    [dbMap.STATUS_SYS_PUBLISHED]: '已发布',
    [dbMap.STATUS_SYS_ABANDONED]: '已废弃'
  };

  return val => statusMap[val];
}

function _cutStr(str, len = 100) {
  if (!str) {
    return '';
  }
  if (str.length <= len) {
    return str;
  }
  return str.substr(0, len) + '...';
}

const _toSemantic = {
  groupId: {dao: bisgroupDao},
  projectId: {dao: projectDao},
  respoId: {dao: userDao, field: 'realname'},
  toolSpecWeb: {fn: _toSpec},
  toolSpecAos: {fn: _toSpec},
  toolSpecIos: {fn: _toSpec},
  toolSpecTest: {fn: _toSpec},
  document: {fn: _cutStr},
  description: {fn: _cutStr},
  verification: {
    fn: function (val) {
      return val === dbMap.PRG_VRF_AUTH ? '验证通过' : '自动通过';
    },
    _ifMatchResType: [dbMap.RES_TYP_PROGROUP]
  },
  apply: {
    fn: function*(val) {
      if (val === 0) {
        return '所有类型';
      }
      let it = yield datatypeDao.find(val);
      return it.name;
    },
    _ifMatchResType: [dbMap.RES_TYP_CONSTRAINT]
  },
  type: {
    fn: function*(val) {
      let it = yield datatypeDao.find(val);
      return (it && it.name) ? it.name : 'Object';
    },
    _ifMatchResType: [dbMap.RES_TYP_DATATYPE, dbMap.RES_TYP_INTERFACE, dbMap.RES_TYP_RPC, dbMap.RES_TYP_TEMPLATE, dbMap.RES_TYP_WEBVIEW]
  },
  'reqFormat-resFormat-format': {
    fn: _toFormat(),
    _ifMatchResType: [dbMap.RES_TYP_INTERFACE, dbMap.RES_TYP_RPC, dbMap.RES_TYP_DATATYPE]
  },
  language: {
    fn: _toSpecLanguage(),
    _ifMatchResType: [dbMap.RES_TYP_SPEC]
  },
  statusId: {
    fn: _toStatus(),
    _ifMatchResType: [dbMap.RES_TYP_INTERFACE, dbMap.RES_TYP_RPC]
  },
  engine: {
    fn: _toSpecEngine(),
    _ifMatchResType: [dbMap.RES_TYP_SPEC]
  },
  'viewRoot-webRoot-mockApiRoot-mockViewRoot': {
    dao: specDirectoryDao,
    _ifMatchResType: [dbMap.RES_TYP_SPEC]
  },
  'isShare': {
    fn: function (val) {
      if (val === dbMap.CMN_BOL_YES) {
        return '分享';
      }
      return '取消分享';
    },
    _ifMatchResType: [dbMap.RES_TYP_SPEC]
  },
  'isLock': {
    fn: function (val) {
      if (val === dbMap.CMN_BOL_YES) {
        return '锁定';
      }
      return '取消锁定';
    },
    _ifMatchResType: [dbMap.RES_TYP_SPEC, dbMap.RES_TYP_PROGROUP]
  }
};

function transformFn(resType, prop) {
  let map;
  Object.keys(_toSemantic).some(att => {
    let it = _toSemantic[att];
    let atts = [att];
    if (/-/.test(att)) {
      atts = att.split('-');
    }
    if (atts.includes(prop)) {
      let _ifMatchResType = it._ifMatchResType;
      if (!_ifMatchResType || _ifMatchResType.includes(resType)) {
        map = it;
        return true;
      }
    }
  });
  if (!map) {
    return;
  }
  if (map.dao) {
    let field = map.field || 'name';
    return function*(id) {
      let att = yield map.dao.find(id);
      return att && att[field];
    };
  }
  if (map.fn) {
    return map.fn;
  }
}

function dumpOwnerIds(resType, data, parent) {
  data = parent || data; //delegate to parent data if possible
  if (resType === dbMap.RES_TYP_SPEC) {
    return {specId: data.id};
  } else if (resType === dbMap.RES_TYP_PROGROUP) {
    return {progroupId: data.id};
  } else if (resType === dbMap.RES_TYP_PROJECT) {
    return {
      projectId: data.id,
      progroupId: data.progroupId
    };
  } else {
    return {
      projectId: data.projectId,
      progroupId: data.progroupId
    };
  }
}

function* fetch(data, prop, daoName) {
  if (data[prop]) {
    return data[prop];
  }
  let ids = data[`${prop}Id`] || data[`${prop}Ids`];
  let dao = new (require(`../../dao/${daoName}`))(sqlOpt);
  let rec = yield dao.findBatch(ids);
  if (!Array.isArray(ids)) {
    rec = rec[0];
  }
  return rec;
}

function isAnonymousDatatype(data) {
  return data && data.constructor && (data.constructor.name === 'Datatype') && (data.type === dbMap.MDL_TYP_HIDDEN);
}

function getResourceType(param) {
  switch (param.parentType) {
    case dbMap.PAM_TYP_INPUT:
    case dbMap.PAM_TYP_OUTPUT:
      return dbMap.RES_TYP_INTERFACE;
    case dbMap.PAM_TYP_RPC_INPUT:
    case dbMap.PAM_TYP_RPC_OUTPUT:
      return dbMap.RES_TYP_RPC;
    case dbMap.PAM_TYP_ATTRIBUTE:
      return dbMap.RES_TYP_DATATYPE;
    case dbMap.PAM_TYP_VMODEL:
      return dbMap.RES_TYP_TEMPLATE;
    // 页面的请求参数不应该有 Object 类型
    // case dbMap.PAM_TYP_QUERY:
    //   return dbMap.RES_TYP_WEBVIEW;
    default:
      break;
  }
}

function* getResource(resType, resId) {
  switch (resType) {
    case dbMap.PAM_TYP_INPUT:
    case dbMap.PAM_TYP_OUTPUT:
      // HTTP 接口参数
      return yield interfaceDao.find(resId);
    case dbMap.PAM_TYP_RPC_INPUT:
    case dbMap.PAM_TYP_RPC_OUTPUT:
      // rpc接口参数
      return yield rpcDao.find(resId);
    case dbMap.PAM_TYP_ATTRIBUTE:
      // 数据模型属性
      return yield datatypeDao.find(resId);
    case dbMap.PAM_TYP_VMODEL:
      // 页面模板预填数据
      return yield templateData.find(resId);
  }
  return {};
}

// 获取引用了该匿名数据模型的参数列表(查到最上层为止，结果是所有遍历到的参数组成的数组)以及所属的资源
function* getAnonymousDatatypeQuotingParamsAndResource(datatypeId) {
  let params = [];
  let param = {};
  let resource = null;
  let paramType = datatypeId;
  while (paramType) {
    let result = yield parameterDao.getByType(paramType);
    if (result.length) {
      param = result[0];
      params.unshift(param);
      // 父级类型还是参数，继续查找
      if (param.parentType === dbMap.PAM_TYP_ATTRIBUTE) {
        paramType = param.parentId;
      } else {
        resource = yield getResource(param.parentType, param.parentId);
        break;
      }
    } else {
      resource = yield getResource(param.parentType, param.parentId);
      break;
    }
  }
  return {
    params,
    resource
  };
}

function getAddAttributesOnAnonymousDatatypeHistoryText(params, resource, names) {
  const namesPath = params.map(param => param.name).join(' -> ');
  const param = params[0];
  let historyText = '';
  switch (param.parentType) {
    case dbMap.PAM_TYP_INPUT:
      historyText = `添加HTTP 接口请求参数 ${namesPath} -> ${names} 到 ${resource.name}`;
      break;
    case dbMap.PAM_TYP_OUTPUT:
      historyText = `添加HTTP 接口响应结果 ${namesPath} -> ${names} 到 ${resource.name}`;
      break;
    case dbMap.PAM_TYP_RPC_INPUT:
      historyText = `添加 RPC 接口请求参数 ${namesPath} -> ${names} 到 ${resource.name}`;
      break;
    case dbMap.PAM_TYP_RPC_OUTPUT:
      historyText = `添加 RPC 接口响应结果 ${namesPath} -> ${names} 到 ${resource.name}`;
      break;
    case dbMap.PAM_TYP_ATTRIBUTE:
      historyText = `添加数据模型属性 ${namesPath} -> ${names} 到 ${resource.name}`;
      break;
    case dbMap.PAM_TYP_VMODEL:
      historyText = `添加页面模板预填数据 ${namesPath} -> ${names} 到 ${resource.name}`;
      break;
    // 页面的请求参数不应该有 Object 类型
    // case dbMap.PAM_TYP_QUERY:
    //   historyText = `添加页面请求参数 ${namesPath} -> ${names} 到 ${resource.name}`;
    //   break;
    default:
      break;
  }
  return historyText;
}

function getDeleteAttributesOnAnonymousDatatypeHistoryText(params, resource, names) {
  const namesPath = params.map(param => param.name).join(' -> ');
  const param = params[0];
  let historyText = '';
  switch (param.parentType) {
    case dbMap.PAM_TYP_INPUT:
      historyText = `从HTTP 接口 ${resource.name} 删除请求参数 ${namesPath} -> ${names}`;
      break;
    case dbMap.PAM_TYP_OUTPUT:
      historyText = `从HTTP 接口 ${resource.name} 删除响应结果 ${namesPath} -> ${names}`;
      break;
    case dbMap.PAM_TYP_RPC_INPUT:
      historyText = `从 RPC 接口 ${resource.name} 删除请求参数 ${namesPath} -> ${names}`;
      break;
    case dbMap.PAM_TYP_RPC_OUTPUT:
      historyText = `从 RPC 接口 ${resource.name} 删除响应结果 ${namesPath} -> ${names}`;
      break;
    case dbMap.PAM_TYP_ATTRIBUTE:
      historyText = `从数据模型 ${resource.name} 删除属性 ${namesPath} -> ${names}`;
      break;
    case dbMap.PAM_TYP_VMODEL:
      historyText = `从页面模板 ${resource.name} 删除预填数据 ${namesPath} -> ${names}`;
      break;
    // 页面的请求参数不应该有 Object 类型
    // case dbMap.PAM_TYP_QUERY:
    //   historyText = `从页面 ${resource.name} 删除请求参数 ${namesPath} -> ${names}`;
    //   break;
    default:
      break;
  }
  return historyText;
}

const updateAnonymousDatatypeAttributeMap = {
  name: '名称',
  type: '类型',
  description: '描述',
  required: '是否必需',
  defaultValue: '默认值',
  genExpression: '生成规则'
};

function getUpdateAttributesOnAnonymousDatatypeHistoryText(params, resource, key, data) {
  const namesPath = params.map(param => param.name).join(' -> ');
  const param = params[0];
  let historyText = '';
  if (resource[FORMAT_FIELD[param.parentType]] === 0) {
    data.shift();
  }
  switch (param.parentType) {
    case dbMap.PAM_TYP_INPUT:
      historyText = `更新HTTP 接口 ${resource.name} 请求参数 ${namesPath} -> ${data[0]} 的 ${updateAnonymousDatatypeAttributeMap[key]} 为 ${data[1]}，旧值是 ${data[2]}`;
      break;
    case dbMap.PAM_TYP_OUTPUT:
      historyText = `更新HTTP 接口 ${resource.name} 响应结果 ${namesPath} -> ${data[0]} 的 ${updateAnonymousDatatypeAttributeMap[key]} 为 ${data[1]}，旧值是 ${data[2]}`;
      break;
    case dbMap.PAM_TYP_RPC_INPUT:
      historyText = `更新 RPC 接口 ${resource.name} 请求参数 ${namesPath} -> ${data[0]} 的 ${updateAnonymousDatatypeAttributeMap[key]} 为 ${data[1]}，旧值是 ${data[2]}`;
      break;
    case dbMap.PAM_TYP_RPC_OUTPUT:
      historyText = `更新 RPC 接口 ${resource.name} 响应结果 ${namesPath} -> ${data[0]} 的 ${updateAnonymousDatatypeAttributeMap[key]} 为 ${data[1]}，旧值是 ${data[2]}`;
      break;
    case dbMap.PAM_TYP_ATTRIBUTE:
      historyText = `更新数据模型 ${resource.name} 属性 ${namesPath} -> ${data[0]} 的 ${updateAnonymousDatatypeAttributeMap[key]} 为 ${data[1]}，旧值是 ${data[2]}`;
      break;
    case dbMap.PAM_TYP_VMODEL:
      historyText = `更新页面模板 ${resource.name} 预填数据 ${namesPath} -> ${data[0]} 的 ${updateAnonymousDatatypeAttributeMap[key]} 为 ${data[1]}，旧值是 ${data[2]}`;
      break;
    // 页面的请求参数不应该有 Object 类型
    // case dbMap.PAM_TYP_QUERY:
    //   historyText = `更新页面 ${resource.name} 请求参数 ${namesPath} -> ${data[0]} 的 ${updateAnonymousDatatypeAttributeMap[key]} 为 ${data[1]}，旧值是 ${data[2]}`;
    //   break;
    default:
      break;
  }
  return historyText;
}

function* parseAddAndDelTextArgs(data, historyObj = {}, resType, dao, oprType, childrenData) {
  let args = [];
  let parent;
  let template = historyObj[`${oprType}Text`];
  let _rel = historyObj['_rel'];

  if (!template) {
    return;
  }
  if (_rel) {
    parent = yield fetch(data, '_parent', _rel.parent.dao);
    let children = childrenData || (yield fetch(data, '_children', _rel.child.dao));
    let names = children.map(it => it.name).join(',');
    let type = children[0].parentType;
    if (oprType === 'add') {
      if (isAnonymousDatatype(parent)) {
        // 匿名类型，增加属性。匿名类型可能出现在接口的请求和响应参数中，也可能出现在数据模型中，需要详细的历史动态
        // 匿名类型只会被一个地方引用，这里需要反向查找出来被谁引用了，前端请求中并没有带这一信息
        let result = yield getAnonymousDatatypeQuotingParamsAndResource(parent.id);
        let opContent = getAddAttributesOnAnonymousDatatypeHistoryText(result.params, result.resource, names);
        return {
          opContent,
          resType: getResourceType(result.params[0]),
          resId: result.resource.id,
          projectId: result.resource.projectId,
          progroupId: result.resource.progroupId
        };
      } else {
        args = [names, parent && parent.name];
        if (parent[FORMAT_FIELD[type]] === dbMap.MDL_FMT_ENUM) {
          args.shift();
          args.unshift(data.defaultValue);
          args.unshift(FORMAT_NAME[parent[FORMAT_FIELD[type]]]);
        } else if (parent[FORMAT_FIELD[type]] === dbMap.MDL_FMT_HASH) {
          args.unshift(HASH_FORMAT_NAME[resType]);
        } else if (parent[FORMAT_FIELD[type]] != null) {
          args.unshift('');
        }
      }
    } else {
      if (isAnonymousDatatype(parent)) {
        // 删除匿名数据模型中的属性
        let result = yield getAnonymousDatatypeQuotingParamsAndResource(parent.id);
        let opContent = getDeleteAttributesOnAnonymousDatatypeHistoryText(result.params, result.resource, names);
        return {
          opContent,
          resType: getResourceType(result.params[0]),
          resId: result.resource.id,
          projectId: result.resource.projectId,
          progroupId: result.resource.progroupId
        };
      }
      args = [parent && parent.name];
      if (parent[FORMAT_FIELD[type]] === dbMap.MDL_FMT_ENUM) {
        args.push(FORMAT_NAME[parent[FORMAT_FIELD[type]]]);
      } else if (parent[FORMAT_FIELD[type]] === dbMap.MDL_FMT_HASH) {
        args.push(HASH_FORMAT_NAME[resType]);
      } else if (parent[FORMAT_FIELD[type]] != null) {
        args.push('');
      }
      if (parent[FORMAT_FIELD[type]] === dbMap.MDL_FMT_ENUM) {
        var value = children.map(it => it.defaultValue).join(',');
        args.push(value);
      } else {
        args.push(names);
      }
    }
    data.id = parent && parent.id; // delegate resId to parent id
  } else {
    if (isAnonymousDatatype(data)) {
      // 匿名数据类型的增加和删除，不产生动态
      return;
    }
    args = [data.name];
    if (resType === dbMap.RES_TYP_SPEC) {
      let specType = specTypeMap[data.type];
      args.unshift(specType);
    }
  }
  let opContent = _.formatString(template, args);
  return Object.assign({opContent, resType}, dumpOwnerIds(resType, data, parent));
}

function* parseUpdateTextArgs({_model, _oData, _parentId, _parent}, historyObj, dao, oprType, _context) {
  let ret = [];
  let it = arguments[0];
  let {resType, updateText: updateTextObj, _rel} = historyObj;
  let res;
  if (DAO_MAP[historyObj.resType]) {
    res = yield DAO_MAP[historyObj.resType].find(_parentId);
  }
  if (!updateTextObj) {
    return;
  }
  for (let key in _model) {
    if (!_model.hasOwnProperty(key) || /^id$|pinyin$/.test(key)) {
      continue;
    }
    let propObj = updateTextObj[key];
    if (!propObj) {
      continue;
    }
    let _toFn = transformFn(resType, key);

    function* getVal(value, model) {
      let val = _toFn ?
        _toFn.constructor.name === 'GeneratorFunction' ?
          yield _toFn(value, {resType, _context, it}) :  //_toFn is generator
          _toFn(value) // _toFn is normal function
        : value; //_toFn doesn't exist
      if (key === 'type' && model.isArray) {
        val = 'Array ' + val;
      }
      return val;
    }

    let val = yield getVal(_model[key], _model);
    let oldVal = yield getVal(_oData[key], _oData);

    let args = [];
    if (res && res[FORMAT_FIELD[_model.parentType]] > 0) {
      args.push(FORMAT_NAME[res[FORMAT_FIELD[_model.parentType]]]);
      if (res[FORMAT_FIELD[_model.parentType]] === dbMap.MDL_FMT_ENUM) {
        if (key === 'defaultValue') {
          args.push(val);
        } else {
          args.push(_oData.defaultValue);
        }
      } else {
        args.push('');
      }
    } else {
      if (res && res[FORMAT_FIELD[_model.parentType]] === 0) {
        args.push(HASH_FORMAT_NAME[historyObj.resType]);
      }
      args.push(_oData.name);
    }
    if (REQUIRED_VAL_TO_HUMAN_TEXT[key]) {
      args.push(REQUIRED_VAL_TO_HUMAN_TEXT[key][val]);
      args.push(REQUIRED_VAL_TO_HUMAN_TEXT[key][oldVal]);
    } else {
      args.push(val);
      args.push(oldVal);
    }
    if (resType === dbMap.RES_TYP_SPEC) {
      args.unshift(specTypeMap[_oData.type]);
      if (key === 'isShare') {
        let op = args.pop();
        args.unshift(op);
      }
    }
    // TODO 临时修改  spec待处理
    if (_model.id) {
      it.id = _model.id;
    }
    if (_parentId || _parent) {
      if (!_parent) {
        let dao = new (require(`../../dao/${_rel.parent.dao}`))(sqlOpt);
        _parent = yield dao.find(_parentId);
      }
      // 这里要判断是否是匿名数据模型，如果是，它产生的历史动态要归属到引用它的资源，而不是匿名数据模型自身
      if (isAnonymousDatatype(_parent)) {
        let result = yield getAnonymousDatatypeQuotingParamsAndResource(_parent.id);
        let opContent = getUpdateAttributesOnAnonymousDatatypeHistoryText(result.params, result.resource, key, args);
        return {
          opContent,
          resType: getResourceType(result.params[0]),
          resId: result.resource.id,
          projectId: result.resource.projectId,
          progroupId: result.resource.progroupId
        };
      }
      if (_parent) {
        args.unshift(_parent.name);
        it.id = _parent.id;
      }
    }
    let template = propObj['text'];
    let opContent = _.formatString(template, args);
    ret.push(Object.assign({opContent, resType}, dumpOwnerIds(resType, _parent || _oData)));
  }
  return ret;
}

function* parseSpecDocTextArgs(data, historyObj, oprType, spec) {
  let template = historyObj[`${oprType}Text`],
    opContent,
    type = specTypeMap[(spec && spec.type) || dbMap.CMN_TYP_WEB],
    args = [type, spec.name];
  if (oprType !== 'update') {
    if (oprType === 'importSystem') {
      let importId = data._importId;
      if ([dbMap.SPC_SYS_MAVEN, dbMap.SPC_SYS_NODE].includes(importId)) {
        args.unshift(importId === dbMap.SPC_SYS_MAVEN ? 'Maven' : 'Node');
      }
    }
    if (/^(add|del|dirUpload)$/.test(oprType)) {
      let specPath = '根目录';
      if (data.parent) {
        let parent = yield specDirectoryDao.find(data.parent);
        specPath = parent.name;
      }
      let specDocType = data.type === dbMap.SPC_NOD_DIR ? '目录' : '文件';
      args.push(specPath, specDocType, data.name);
    }
    opContent = _.formatString(template, args);
    return {specId: spec.id, opContent};
  } else if (oprType === 'update') {
    let {_model, _oData} = data,
      updateTextObj = historyObj['updateText'],
      ret = [];
    for (let key in _model) {
      if (!_model.hasOwnProperty(key) || key === 'id') {
        continue;
      }
      let propObj = updateTextObj[key];
      if (!propObj) {
        return;
      }
      template = propObj['text'];
      let specDocType = _oData.type === dbMap.SPC_NOD_DIR ? '目录' : '文件';
      let params = args.concat([specDocType, _oData.name]);
      let opContent = _.formatString(template, params);
      ret.push({specId: spec.id, opContent});
    }
    return ret;
  }
}

function* iterate(ret, gen, ...gargs) {
  let activities = [];
  for (let it of ret) {
    let rec = yield gen(it, ...gargs);
    if (!Array.isArray(rec)) {
      rec = [rec];
    }
    rec.forEach(ac => {
      if (ac) {
        // 有些情况需要更换resId，前面的逻辑已经处理过了
        // 比如在HTTP 接口的请求参数，更改匿名数据模型，真正的动态应该算在HTTP 接口上，而不是数据模型
        if (ac.hasOwnProperty('resId') === false) {
          Object.assign(ac, {resId: it.id});
        }
        activities.push(ac);
      }
    });
  }
  return activities;
}

let history = {
  * flush(activities) {
    if (!activities || !activities.length) {
      return;
    }
    let activity = activities[0];
    let isSpec = !!activity.specId;
    if (isSpec) {
      activities.forEach((it) => {
        it.resId = it.specId;
        it.resType = dbMap.RES_TYP_SPEC;
      });
    }
    let model = resHistoryDao._Model;
    activities.forEach((it) => {
      Object.keys(it).forEach(key => {
        if (!model.getField(key)) {
          delete it[key];
        }
      });
    });
    return yield resHistoryDao.createBatch(activities);
  },

  /**
   * @param  {Object} options
   * @param  {String} options.dName - dao name. e.g. BisGroupDao
   * @param  {Array | Object} options.ret - data.
   * @param  {String} options.oprType - action type
   * @param  {Boolean} options.isImport - whether is importing, for parameter.
   * @return {Array} history activities to be logged
   */* byAddOrDel({dName, ret, oprType, isImport, children}) {
    ret = _.toArray(ret);
    let dao = new (require(`../../dao/${dName}`))(sqlOpt);
    let historyObj = dao.constructor['__history'];
    if (!historyObj) {
      return;
    }
    let {resType} = historyObj;
    if (isImport) {
      historyObj = historyObj['imp0rt'];
    }
    let activities = yield iterate(ret, parseAddAndDelTextArgs, historyObj, resType, dao, oprType, children);
    return activities;
  },

  /**
   * @param  {Object} options
   * @param  {String} options.dName - dao name. e.g. BisGroupDao
   * @param  {Array Object} options.ret - data.
   * @param  {String} options.oprType - action type
   * @return {Array} history activities to be logged
   */* byUpdate({dName, ret, oprType}) {
    ret = _.toArray(ret);
    let dao = new (require(`../../dao/${dName}`))(sqlOpt);
    let historyObj = dao.constructor['__history'];
    if (historyObj == null) {
      return;
    }
    let activities = yield iterate(ret, parseUpdateTextArgs, historyObj, dao, oprType, arguments[0]);
    return activities;
  },

  * progroupUserOpt({dName, ret}) {
    if (!Array.isArray(ret)) {
      ret = [ret];
    }
    let dao = new (require(`../../dao/${dName}`))(sqlOpt);
    let historyObj = dao.constructor['__history'];
    let {resType} = historyObj;

    let activities = [];
    ret.forEach(item => {
      let {progroup, user, role} = item;
      let opContent = _.formatString(historyObj[`${item.action}Text`], [user.realname, progroup.name, userRoleMap[role]]);
      activities.push({opContent, resType, progroupId: progroup.id, resId: progroup.id});
    });
    return activities;
  },

  * progroupApiSpecOpt({dName, ret, apiType, progroup}) {
    const dao = new (require(`../../dao/${dName}`))(sqlOpt);
    const historyObj = dao.constructor['__history'];
    const {resType} = historyObj;
    const activities = [];
    historyObj.canUpdateProps.forEach(prop => {
      if (ret.newApiSpec[prop.name] !== ret.oldApiSpec[prop.name]) {
        let opContent = _.formatString(historyObj.updateText, [
          progroup.name,
          historyObj.apiTypeNames[apiType],
          prop.description,
          ret.newApiSpec[prop.name],
          ret.oldApiSpec[prop.name]
        ]);
        activities.push({opContent, resType, progroupId: progroup.id, resId: progroup.id});
      }
    });
    return activities;
  },

  * progroupVerOpt({dName, ret}) {
    ret = _.toArray(ret);
    let dao = new (require(`../../dao/${dName}`))(sqlOpt);
    let historyObj = dao.constructor['__history'];
    if (historyObj == null) {
      return;
    }
    let {resType} = historyObj;
    let activities = [];
    for (let item of ret) {
      let {role, userId, v, progroupId} = item;
      let progroup = yield progroupDao.find(progroupId);
      let user = yield userDao.find(userId);
      if (progroup && user) {
        let args = [user.realname];
        if (v) {
          args.push(userRoleMap[role]);
        }
        args.push(progroup.name);
        let opContent = _.formatString(historyObj[`${v ? 'pass' : 'reject'}Text`], args);
        activities.push({opContent, resType, progroupId, resId: progroupId});
      }
    }
    return activities;
  },

  * auditOpt({dName, ret, resType, model}) {
    let dao = new (require(`../../dao/${dName}`))(sqlOpt);
    let historyObj = dao.constructor['__history'];
    let activities = [];
    if (model.state === dbMap.AUDIT_TYP_APPROVED) {
      const opContent = _.formatString(historyObj.approveText, [
        ret.name
      ]);
      activities.push({opContent, resType, resId: ret.id});
    } else {
      const opContent = _.formatString(historyObj.rejectText, [
        ret.name,
        model.reason
      ]);
      activities.push({opContent, resType, resId: ret.id});
    }
    return activities;
  },

  // 这里和下面的关注分开，是因为有权限更改资源关注的用户的更新接口直接调用的底层Dao，并没有调用Service
  * watchListOpt({dName, progroupId, projectId, resId, resType, ret}) {
    const dao = new (require(`../../dao/${dName}`))(sqlOpt);
    const historyObj = dao.constructor['__history'];
    const activities = [];
    const users = yield userDao.findBatch(ret.difference.map(i => i.id));
    const interface = yield interfaceDao.find(resId);  // 给更新加上version
    ret.difference.forEach(item => {
      var user = users.filter(i => i.id === item.id)[0];
      if (user) {
        let opContent = _.formatString(historyObj.updateText.watchList.text, [user.realname, item.op === 'add' ? '关注' : '取消关注', interface.name]);
        activities.push({opContent, resType, resId, progroupId, projectId});
      }
    });
    return activities;
  },

  // 这里的资源关注都必须是同一个project
  * resourceWatchOpt({dName, oprType, progroupId, projectId, resType, ret: {data}}) {
    const dao = new (require(`../../dao/${dName}`))(sqlOpt);
    const historyObj = dao.constructor['__history'];
    const activities = [];
    const progroup = yield progroupDao.find(progroupId);
    const project = yield projectDao.find(projectId);
    const template = historyObj[`${oprType}Text`];
    data.forEach(item => {
      const opContent = _.formatString(template, [progroup.name, project.name, SERVICE_NAME[resType], item.name]);
      activities.push({
        opContent,
        progroupId,
        projectId,
        resType,
        resId: item.id
      });
    });
    return activities;
  },

  * resourceVersionOpt({dName, oprType, ret}) {
    const dao = new (require(`../../dao/${dName}`))(sqlOpt);
    const historyObj = dao.constructor['__history'];
    const activities = [];
    const progroups = [];
    const projects = [];
    const resources = [];
    for (let i = 0; i < ret.data.length; i++) {
      progroups.push(yield progroupDao.find(ret.data[i].progroupId));
      projects.push(yield projectDao.find(ret.data[i].projectId));
      resources.push(yield DAO_MAP[ret.data[i].resType].find(ret.data[i].parent));
    }
    const template = historyObj[`${oprType}Text`];
    resources.forEach((item, index) => {
      const opContent = _.formatString(template, [progroups[index].name, projects[index].name, SERVICE_NAME[ret.data[index].resType], item.name, ret.data[index].name]);
      activities.push({
        opContent,
        resType: ret.data[index].resType,
        resId: ret.data[index].resId,
        progroupId: ret.data[index].progroupId,
        projectId: ret.data[index].projectId
      });
    });
    return activities;
  },

  * cloneOpt({dName, ret: {progroupId, obj, targetRes}}) {
    // 复制操作的资源history统一来自ResourceDao
    const dao = new (require(`../../dao/ResourceDao`))(sqlOpt);
    const resDao = new (require(`../../dao/${dName}`))(sqlOpt);
    const historyObj = dao.constructor['__history'];
    const template = historyObj[`cloneText`];
    const resType = resDao._type;
    const ids = obj.copys.map(i => i.id);
    const sourceRes = yield DAO_MAP[resType].findBatch(ids);
    const sourcePg = yield progroupDao.find(sourceRes[0].progroupId);
    const sourcePj = yield projectDao.find(sourceRes[0].projectId);
    const targetPg = yield progroupDao.find(progroupId);
    const targetPj = yield projectDao.find(obj.pid);
    const targetGp = yield bisgroupDao.find(obj.gid);
    const activities = [];
    sourceRes.forEach((i, index) => {
      const opContent = _.formatString(template, [
        sourcePg.name,
        sourcePj.name,
        SERVICE_NAME[resType],
        i.name,
        targetPg.name,
        targetPj.name,
        targetGp.name,
        SERVICE_NAME[resType],
        obj.copys.find(item => item.id === i.id).name
      ]);
      // 复制操作的日志算做复制目标项目组项目的日志
      activities.push({
        opContent,
        progroupId: progroupId,
        projectId: targetPj.id,
        resType,
        resId: targetRes[index].id
      });
    });
    return activities;
  },

  * moveOpt({dName, ret: {progroupId, obj, oldProgroupId, oldProjectId, moveNames}}) {
    // 移动操作的资源history统一来自ResourceDao
    const dao = new (require(`../../dao/ResourceDao`))(sqlOpt);
    const resDao = new (require(`../../dao/${dName}`))(sqlOpt);
    const historyObj = dao.constructor['__history'];
    const template = historyObj[`moveText`];
    const resType = resDao._type;
    const sourcePg = yield progroupDao.find(oldProgroupId);
    const sourcePj = yield projectDao.find(oldProjectId);
    const targetPg = yield progroupDao.find(progroupId);
    const targetPj = yield projectDao.find(obj.pid);
    const targetGp = yield bisgroupDao.find(obj.gid);
    const activities = [];
    obj.moves.forEach((i, index) => {
      const opContent = _.formatString(template, [
        sourcePg.name,
        sourcePj.name,
        SERVICE_NAME[resType],
        moveNames[index],
        targetPg.name,
        targetPj.name,
        targetGp.name,
        SERVICE_NAME[resType],
        moveNames[index]
      ]);
      activities.push({
        opContent,
        progroupId: progroupId,
        projectId: targetPj.id,
        resType,
        resId: i
      });
    });
    return activities;
  },

  * specDocOpt({ret, oprType}) {
    ret = _.toArray(ret);
    let historyObj = specDirectoryDao.constructor['__history'];
    let item = ret[0];
    let specId = oprType === 'update' ? item._oData['specId'] : item['specId'];
    let spec = yield specDao.find(specId);
    if (!spec) {
      return [];
    }
    let activities = yield iterate(ret, parseSpecDocTextArgs, historyObj, oprType, spec);
    activities.forEach(it => {
      delete it.resId;
      it.specId = specId;
    });
    return activities;
  },

  * wordForbid({ret}) {
    const {progroupId, projectId, models, newStatus} = ret;
    const historyObj = wordDao.constructor['__history'];
    const template = historyObj[`forbidText`];
    const activities = [];
    const sourcePj = yield projectDao.find(projectId);
    models.forEach(model => {
      const opContent = _.formatString(template, [model.name, sourcePj.name, REQUIRED_VAL_TO_HUMAN_TEXT['wordForbidStatus'][newStatus]]);
      activities.push({
        opContent,
        progroupId: progroupId,
        projectId: projectId, //此处的 projectId 表示的是操作禁用关系的项目，而非该资源的归属项目。
        resType: historyObj.resType,
        resId: model.id,
      });
    });
    return activities;
  },

  /**
   * @param  {Object} options
   * @param  {String} options.dName - dao name. e.g. BisGroupDao
   * @param  {Number} options.uid - user id
   * @param  {Array Object} options.ret - data.
   * Each element in the array should have the format depending on resType:
   *     Add/Del:
   *          {
   *              [self attributes]:
   *              [_parent]:
   *              [_parentId]:
   *              [_children]:
   *              [_childrenIds]:
   *          }
   *     Update: {
   *             _oData:
   *             _model:
   *             _parent:
   *             _parentId:
   *         }
   * @param  {String} options.oprType - action type
   * @param  {String} options.isImport - used for parameter add and delete only.
   * @return {Void}
   */* log(options) {
    let {dName, oprType, uid} = options;
    let activities;
    if (dName === 'ResourceWatchDao') {
      activities = yield history.resourceWatchOpt(options);
    } else if (dName === 'ResourceVersionDao') {
      activities = yield history.resourceVersionOpt(options);
    } else if (dName === 'SpecificationDirectoryDao') {
      activities = yield history.specDocOpt(options);
    } else if (dName === 'ProGroupUserDao') {
      activities = yield history.progroupUserOpt(options);
    } else if (dName === 'ProGroupApiSpecDao') {
      activities = yield history.progroupApiSpecOpt(options);
    } else if (dName === 'ProGroupVerOPDao') {
      activities = yield history.progroupVerOpt(options);
    } else if (oprType === 'audit') {
      activities = yield history.auditOpt(options);
    } else if (oprType === 'clone') {
      activities = yield history.cloneOpt(options);
    } else if (oprType === 'move') {
      activities = yield history.moveOpt(options);
    } else if (oprType === 'watchList') {
      activities = yield history.watchListOpt(options);
    } else if (oprType === 'update') {
      activities = yield history.byUpdate(options);
    } else if (dName === 'WordDao' && oprType === 'forbid') {
      activities = yield history.wordForbid(options);
    } else {
      activities = yield history.byAddOrDel(options);
    }
    (activities || []).forEach(it => it.userId = uid);
    yield history.flush(activities);
  }
};

module.exports = history;
