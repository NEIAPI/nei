const log = require('../util/log');
const db = require('../../common').db;

class ParamRpcDao extends require('./ParameterDao') {
  * clear(id) {
    log.debug(
      '[%s.clear] clear parameters for interface %s with type %s',
      this.constructor.name, id, this._parentType
    );
    yield this._clearParameters(
      id, this._parentType
    );
  }
}

ParamRpcDao['__history'] = {
  addText: '添加 RPC 接口请求参数 %s 到 %s',
  delText: '从 RPC 接口 %s 删除请求参数 %s',
  updateText: {
    name: {
      text: '更新 RPC 接口 %s 请求参数 %s 名称为 %s'
    },
    description: {
      text: '更新 RPC 接口 %s 请求参数 %s 描述为 %s',
    },
    type: {
      text: '更新 RPC 接口 %s 请求参数 %s 类型为 %s',
    },
    genExpression: {
      text: '更新 RPC 接口 %s 请求参数 %s 规则为 %s'
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
    delText: '从 RPC 接口 %s 请求参数中删除导入数据模型 %s',
  },
  resType: db.RES_TYP_RPC
};

module.exports = ParamRpcDao;
