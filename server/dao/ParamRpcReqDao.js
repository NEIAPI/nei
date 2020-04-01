const db = require('../../common').db;

class ParamRpcReqDao extends require('./ParamRpcDao') {
  constructor(sqlOpt) {
    super(db.PAM_TYP_RPC_INPUT, sqlOpt);
  }
}

ParamRpcReqDao['__history'] = {
  addText: '添加请求参数 %s %s 到 RPC 接口 %s',
  delText: '从 RPC 接口 %s 删除请求参数 %s %s',
  updateText: {
    name: {
      text: '更新 RPC 接口 %s 请求参数 %s %s 名称为 %s，旧值是 %s'
    },
    description: {
      text: '更新 RPC 接口 %s 请求参数 %s %s 描述为 %s，旧值是 %s',
    },
    type: {
      text: '更新 RPC 接口 %s 请求参数 %s %s 类型为 %s，旧值是 %s',
    },
    genExpression: {
      text: '更新 RPC 接口 %s 请求参数 %s %s 生成规则为 %s，旧值是 %s'
    },
    defaultValue: {
      text: '更新 RPC 接口 %s 请求参数 %s %s 默认值为 %s，旧值是 %s'
    },
    required: {
      text: '更新 RPC 接口 %s 请求参数 %s %s 是否必需为 %s，旧值是 %s'
    },
    position: {
      text: '更新 RPC 接口 %s 请求参数的参数位置'
    },
    ignored: {
      text: '更新 RPC 接口 %s 请求参数 %s %s 的可见性为 %s'
    }
  },
  _rel: {
    parent: {
      dao: 'RpcDao',
    },
    child: {
      dao: 'ParameterDao'
    }
  },
  'imp0rt': {
    addText: '导入数据模型 %s 到 %s 请求参数中',
    delText: '从 RPC 接口 %s 请求参数中删除导入的数据模型 %s',
    _rel: {
      parent: {
        dao: 'RpcDao',
      },
      child: {
        dao: 'DataTypeDao'
      }
    }
  },
  resType: db.RES_TYP_RPC
};

module.exports = ParamRpcReqDao;
