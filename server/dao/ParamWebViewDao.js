const db = require('../../common').db;

class ParamWebViewDao extends require('./ParameterDao') {
  constructor(sqlOpt) {
    super(db.PAM_TYP_QUERY, sqlOpt);
  }
}

ParamWebViewDao['__history'] = {
  addText: '添加页面访问参数 %s 到 %s',
  delText: '从页面 %s 删除访问参数 %s',
  updateText: {
    name: {
      text: '更新页面 %s 访问参数 %s 名称为 %s，旧值是 %s'
    },
    description: {
      text: '更新页面 %s 访问参数 %s 描述为 %s，旧值是 %s',
    },
    type: {
      text: '更新页面 %s 访问参数 %s 类型为 %s，旧值是 %s',
    },
    genExpression: {
      text: '更新页面 %s 访问参数 %s 生成规则为 %s，旧值是 %s'
    },
    defaultValue: {
      text: '更新页面 %s 访问参数 %s 默认值为 %s，旧值是 %s'
    },
    ignored: {
      text: '更新页面 %s 访问参数 %s 参数可见性为 %s'
    }
  },
  'imp0rt': {
    addText: '导入数据模型 %s 到 %s 页面访问参数',
    delText: '从页面 %s 访问参数中删除导入数据模型 %s',
    _rel: {
      parent: {
        dao: 'ViewDao',
      },
      child: {
        dao: 'DataTypeDao'
      }
    }
  },
  _rel: {
    parent: {
      dao: 'ViewDao',
    },
    child: {
      dao: 'ParameterDao'
    }
  },
  resType: db.RES_TYP_WEBVIEW
};

module.exports = ParamWebViewDao;
