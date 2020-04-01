const db = require('../../common').db;

class ParamInterfacePathVarDao extends require('./ParamInterfaceDao') {
  constructor(sqlOpt) {
    super(db.PAM_TYP_PATHVAR, sqlOpt);
  }
}

ParamInterfacePathVarDao['__history'] = {
  addText: '添加HTTP 接口路径参数 %s 到 %s',
  delText: '从HTTP 接口 %s 删除路径参数 %s',
  updateText: {
    name: {
      text: '更新HTTP 接口 %s 路径参数 %s 名称为 %s，旧值是 %s'
    },
    description: {
      text: '更新HTTP 接口 %s 路径参数 %s 描述为 %s，旧值是 %s',
    },
    type: {
      text: '更新HTTP 接口 %s 路径参数 %s 类型为 %s，旧值是 %s',
    },
    expression: {
      text: '更新HTTP 接口 %s 路径参数 %s 规则为 %s，旧值是 %s'
    }
  },
  _rel: {
    parent: {
      dao: 'InterfaceDao',
    },
    child: {
      dao: 'ParameterDao'
    }
  },
  'imp0rt': {
    addText: '导入数据模型 %s 到 %s 路径参数中',
    delText: '从HTTP 接口 %s 路径参数中删除导入数据模型 %s',
    _rel: {
      parent: {
        dao: 'InterfaceDao',
      },
      child: {
        dao: 'DataTypeDao'
      }
    }
  },
  resType: db.RES_TYP_INTERFACE
};

module.exports = ParamInterfacePathVarDao;
