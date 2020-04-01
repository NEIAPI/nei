const db = require('../../common').db;
const dt = require('./config/const.json');

class WordDao extends require('./ResourceDao') {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_WORD
    }, sqlOpt);
    this._Model = require('../model/db/Word');

    this._expModels = [
      {
        key: 'overwrite',
        Model: require('../model/db/WordOverwrite'),
        Dao: new (require('./WordOverwriteDao'))(sqlOpt)
      }
    ];
  }

  * getListOfSystem() {
    return yield this._doWithCache(
      dt.RDS_WORD_SYSTEM, function*() {
        let ret = yield this.search({
          conds: {
            type: db.WORD_TYP_SYSTEM
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
      'id', 'description', 'name', 'associatedWord', 'tag', 'tag_pinyin', 'create_time'
    ];
  }
}

WordDao['__history'] = {
  addText: '新建参数字典 %s',
  delText: '删除参数字典 %s',
  shareText: '分享参数字典 %s',
  forbidText: '更新参数字典 %s 在 %s 项目中的状态为 %s',
  resType: db.RES_TYP_WORD,
  updateText: {
    name: {
      text: '更新参数字典 %s 名称为 %s'
    },
    description: {
      text: '更新参数字典 %s 描述为 %s',
    },
    tag: {
      text: '更新参数字典 %s 标签为 %s'
    },
    groupId: {
      text: '将参数字典 %s 所在的业务分组调整为 %s',
    },
    associatedWord: {
      text: '更新参数字典 %s 联想词为 %s',
    }
  }
};

module.exports = WordDao;
