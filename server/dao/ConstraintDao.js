const db = require('../../common').db;
const dt = require('./config/const.json');

class ConstraintDao extends require('./ResourceDao') {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_CONSTRAINT
    }, sqlOpt);
    this._Model = require('../model/db/Constraint');
  }

  * getListOfSystem() {
    return yield this._doWithCache(
      dt.RDS_CONSTRAINT_SYSTEM, function*() {
        let ret = yield this.search({
          conds: {
            type: db.MDL_TYP_SYSTEM
          },
          joins: this._getUserJoins()
        });
        return ret;
      }
    );
  }

  /**
   * get search selected fields
   *
   * @protected
   * @return {Array String} search selected fields array
   */
  _getSearchFields() {
    return [
      'id', 'description', 'name', 'tag', 'tag_pinyin', 'create_time'
    ];
  }
}

ConstraintDao['__history'] = {
  addText: '新建规则函数 %s',
  delText: '删除规则函数 %s',
  shareText: '分享规则函数 %s',
  resType: db.RES_TYP_CONSTRAINT,
  updateText: {
    name: {
      text: '更新规则函数 %s 名称为 %s'
    },
    description: {
      text: '更新规则函数 %s 描述为 %s',
    },
    tag: {
      text: '更新规则函数 %s 标签为 %s'
    },
    groupId: {
      text: '将规则函数 %s 所在的业务分组调整为 %s',
    },
    apply: {
      text: '更新规则函数 %s 适用类型为 %s',
    },
    function: {
      text: '更新规则函数 %s 实现逻辑为 %s'
    }
  }
};

module.exports = ConstraintDao;
