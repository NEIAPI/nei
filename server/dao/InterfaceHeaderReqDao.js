const db = require('../../common').db;

class InterfaceHeaderReqDao extends require('./InterfaceHeaderDao') {
  constructor(sqlOpt) {
    super(db.API_HED_REQUEST, sqlOpt);
  }
}

InterfaceHeaderReqDao['__history'] = {
  addText: '添加HTTP 接口请求头 %s 到 %s',
  delText: '从HTTP 接口 %s 删除请求头 %s',
  updateText: {
    name: {
      text: '更新HTTP 接口 %s 请求头 %s 名称为 %s，旧值是 %s'
    },
    description: {
      text: '更新HTTP 接口 %s 请求头 %s 描述为 %s，旧值是 %s',
    },
    type: {
      text: '更新HTTP 接口 %s 请求头 %s 类型为 %s，旧值是 %s',
    },
    defaultValue: {
      text: '更新HTTP 接口 %s 请求头 %s 值为 %s，旧值是 %s'
    },
    position: {
      text: '更新HTTP 接口 %s 请求头的参数位置'
    },
    ignored: {
      text: '更新HTTP 接口 %s 请求头中参数 %s 的可见性为 %s'
    }
  },
  _rel: {
    parent: {
      dao: 'InterfaceDao',
    },
    child: {
      dao: 'InterfaceHeaderDao'
    }
  },
  'imp0rt': {
    addText: '导入数据模型 %s 到 %s 请求头中',
    delText: '从HTTP 接口 %s 请求头中删除导入数据模型 %s',
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

module.exports = InterfaceHeaderReqDao;
