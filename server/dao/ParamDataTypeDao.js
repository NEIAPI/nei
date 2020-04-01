const db = require('../../common').db;

class ParamDataTypeDao extends require('./ParameterDao') {
  constructor(sqlOpt) {
    super(db.PAM_TYP_ATTRIBUTE, sqlOpt);
  }

  /**
   * get data type attributes list in projects
   *
   * @param  {Number} pids - projects id
   * @param  {Object} parameter result object, e.g. { params:[], overwrite:[], imp0rt:[]}
   */
  * getListInProjects(pids) {
    let opt = {
      conds: {
        parent_type: this._parentType
      },
      joins: [{
        table: 'datatype',
        fkmap: {
          id: 'parent_id',
        },
        conds: {
          project_id: pids
        }
      }]
    };
    let ret = {
      params: this.search(opt),
    };
    for (let i = 0, conf; conf = this._expModels[i]; i++) {
      let dao = conf.Dao;
      ret[conf.key] = dao.search(opt);
    }
    ret = yield ret;
    for (let i = 0, conf; conf = this._expModels[i]; i++) {
      let list = ret[conf.key];
      list.forEach(function (it, index, list) {
        list[index] = new conf.Model(it);
      });
      ret[conf.key] = list;
    }
    return ret;
  }
}

ParamDataTypeDao['__history'] = {
  addText: '添加 %s %s 到 数据模型 %s',
  delText: '从数据模型 %s 删除 %s %s',
  updateText: {
    name: {
      text: '更新数据模型 %s %s %s 名称为 %s，旧值是 %s'
    },
    description: {
      text: '更新数据模型 %s %s %s 描述为 %s，旧值是 %s',
    },
    type: {
      text: '更新数据模型 %s %s %s 类型为 %s，旧值是 %s',
    },
    genExpression: {
      text: '更新数据模型 %s %s %s 生成规则为 %s，旧值是 %s'
    },
    defaultValue: {
      text: '更新数据模型 %s %s %s 默认值为 %s，旧值是 %s'
    }
  },
  _rel: {
    parent: {
      dao: 'DataTypeDao',
    },
    child: {
      dao: 'ParameterDao'
    }
  },
  'imp0rt': {
    addText: '导入数据模型 %s 到 %s',
    delText: '从数据模型 %s 属性中删除导入数据模型 %s',
    _rel: {
      parent: {
        dao: 'DataTypeDao',
      },
      child: {
        dao: 'DataTypeDao'
      }
    }
  },
  resType: db.RES_TYP_DATATYPE
};

module.exports = ParamDataTypeDao;
