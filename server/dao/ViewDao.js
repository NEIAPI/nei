const log = require('../util/log');
const db = require('../../common').db;

class ViewDao extends require('./ResourceDao') {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_WEBVIEW
    }, sqlOpt);
    this._pwvDAO = new (require('./ParamWebViewDao'))(sqlOpt);
    this._Model = require('../model/db/View');
  }

  * getListBy(ids, byField) {
    let ret = this._getUserJoins();
    ret.push({
      table: `view_${byField}`,
      fkmap: {view_id: 'id'},
      conds: {
        [`${byField}_id`]: ids
      }
    });
    return yield this.search({
      conds: {
        'progroup_id': {
          op: '!=',
          value: db.PRG_SYS_HIDDEN
        }
      },
      joins: ret
    });
  }

  /**
   * get template Quotes
   *
   * @param  {Number} ids - template ids
   * @return {model/db/View} view list
   */
  * getListByTemplate(ids) {
    log.debug(
      '[%s.getListByTemplate] get quotes for template %s',
      this.constructor.name, ids
    );

    return yield this.getListBy(ids, 'template');
  }

  /**
   * get interface quotes
   *
   * @param  {Number} ids - interface ids
   * @return {model/db/View} view list
   */
  * getListByInterface(ids) {
    log.debug(
      '[%s.getListByInterface] get quotes for interface %s',
      this.constructor.name, ids
    );
    return yield this.getListBy(ids, 'interface');
  }

  /**
   * get search selected fields
   *
   * @protected
   * @return {Array String} search selected fields array
   */
  _getSearchFields() {
    return [
      'id', 'tag', 'tagPinyin', 'type', 'path', 'name',
      'namePinyin', 'description', 'groupId', 'projectId',
      'progroupId', 'createTime'
    ];
  }
}

ViewDao['__history'] = {
  addText: '新建页面 %s',
  delText: '删除页面 %s',
  updateText: {
    name: {
      text: '更新页面 %s 名称为 %s'
    },
    tag: {
      text: '更新页面 %s 标签为 %s'
    },
    description: {
      text: '更新页面 %s 描述为 %s',
    },
    path: {
      text: '更新页面 %s 路径为 %s'
    },
    groupId: {
      text: '将页面 %s 所在的业务分组调整为 %s',
    },
    respoId: {
      text: '修改页面 %s 负责人为 %s',
    },
    projectId: {
      text: '将页面 %s 移动至项目 %s',
    }
  },
  resType: db.RES_TYP_WEBVIEW,
};

module.exports = ViewDao;
