const log = require('../util/log');
const db = require('../../common').db;

class TemplateDao extends require('./ResourceDao') {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_TEMPLATE
    }, sqlOpt);
    this._ptDAO = new (require('./ParamTemplateDao'))(sqlOpt);
    this._Model = require('../model/db/Template');
  }

  /**
   * get list for web view
   *
   * @param  {Number} id - web page view id
   * @return {Array db/model/template} templates
   */
  * getListForWebView(id) {
    log.debug(
      '[%s.getListForWebView] get templates for page view %s',
      this.constructor.name, id
    );
    let ret = this._getUserJoins();
    ret.push({
      table: 'view_template',
      alias: 'view',
      fkmap: {template_id: 'id'},
      conds: {view_id: id}
    });
    return yield this.search({
      joins: ret
    });
  }

  /**
   * get search selected fields
   *
   * @protected
   * @return {Array String} search selected fields array
   */
  _getSearchFields() {
    return [
      'id', 'name', 'name_pinyin', 'description', 'tag',
      'tag_pinyin', 'status', 'path', 'create_time'
    ];
  }

}

TemplateDao['__history'] = {
  addText: '新增模板 %s',
  delText: '删除模板 %s',
  updateText: {
    name: {
      text: '更新页面模板 %s 名称为 %s'
    },
    tag: {
      text: '更新页面模板 %s 标签为 %s'
    },
    description: {
      text: '更新页面模板 %s 描述为 %s',
    },
    groupId: {
      text: '将页面模板 %s 所在的业务分组调整为 %s',
    },
    respoId: {
      text: '修改页面模板 %s 负责人为 %s',
    },
    projectId: {
      text: '将页面模板 %s 移动至项目 %s',
    }
  },
  resType: db.RES_TYP_TEMPLATE
};

module.exports = TemplateDao;
