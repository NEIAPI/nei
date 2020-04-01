const db = require('../../common').db;

class ParamTemplateDao extends require('./ParameterDao') {
  constructor(sqlOpt) {
    super(db.PAM_TYP_VMODEL, sqlOpt);
  }
}

ParamTemplateDao['__history'] = {
  addText: '添加页面模板预填参数 %s 到 %s',
  delText: '从页面模板 %s 删除预填参数 %s',
  updateText: {
    name: {
      text: '更新页面模板 %s 预填参数 %s 名称为 %s，旧值是 %s'
    },
    description: {
      text: '更新页面模板 %s 预填参数 %s 描述为 %s，旧值是 %s',
    },
    type: {
      text: '更新页面模板 %s 预填参数 %s 类型为 %s，旧值是 %s',
    },
    genExpression: {
      text: '更新页面模板 %s 预填参数 %s 生成规则为 %s，旧值是 %s'
    },
    defaultValue: {
      text: '更新页面模板 %s 预填参数 %s 默认值为 %s，旧值是 %s'
    },
    ignored: {
      text: '更新页面模板 %s 预填参数 %s 参数可见性为 %s'
    }
  },
  'imp0rt': {
    addText: '导入数据模型 %s 到 %s 预填参数中',
    delText: '从页面模板 %s 预填参数中删除导入数据模型 %s',
    _rel: {
      parent: {
        dao: 'TemplateDao',
      },
      child: {
        dao: 'DataTypeDao'
      }
    },
  },
  _rel: {
    parent: {
      dao: 'TemplateDao',
    },
    child: {
      dao: 'ParameterDao'
    }
  },
  resType: db.RES_TYP_TEMPLATE
};

module.exports = ParamTemplateDao;
