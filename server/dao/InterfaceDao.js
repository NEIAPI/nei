const log = require('../util/log');
const db = require('../../common').db;
const ResourceDao = require('./ResourceDao');

class InterfaceDao extends ResourceDao {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_INTERFACE
    }, sqlOpt);
    this._Model = require('../model/db/Interface');
  }

  /**
   * get list for web view
   *
   * @param  {Number} id - web page view id
   * @return {Array db/model/View}
   */
  * getListForWebView(id) {
    log.debug(
      '[%s.getListForWebView] get interfaces for page view %s',
      this.constructor.name, id
    );
    let ret = this._getUserJoins();
    ret.push({
      table: 'view_interface',
      alias: 'view',
      fkmap: {interface_id: 'id'},
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
      'id', 'project_id', 'progroup_id', 'description', 'name', 'name_pinyin', 'tag', 'className',
      'tag_pinyin', 'status_id', 'path', 'method', 'create_time', 'schema'
    ];
  }

  /**
   * get resource type filter
   *
   * @protected
   * @return {Object} type filter conditions
   */
  _getResTypeFilter() {
    return {
      type: db.INTERFACE_TYP_HTTP
    };
  };
}

InterfaceDao['__updateJoins'] = [{
  table: 'status',
  alias: 'status',
  fkmap: {id: 'status_id'},
  field: ['id', 'name', 'name_pinyin']
}];

InterfaceDao['__history'] = {
  addText: '新增 HTTP 接口 %s',
  delText: '删除 HTTP 接口 %s',
  shareText: '分享 HTTP 接口 %s',
  resType: db.RES_TYP_INTERFACE,
  updateText: {
    name: {
      text: '更新 HTTP 接口 %s 名称为 %s，旧值是 %s'
    },
    className: {
      text: '更新 HTTP 接口 %s 的代码映射为 %s，旧值是 %s'
    },
    path: {
      text: '更新 HTTP 接口 %s 的请求地址为 %s，旧值是 %s'
    },
    method: {
      text: '更新 HTTP 接口 %s 的请求方式为 %s，旧值是 %s'
    },
    tag: {
      text: '更新 HTTP 接口 %s 标签为 %s，旧值是 %s'
    },
    reqFormat: {
      text: '更新 HTTP 接口 %s 请求参数类型为 %s，旧值是 %s',
    },
    resFormat: {
      text: '更新 HTTP 接口 %s 响应结果类型为 %s，旧值是 %s',
    },
    description: {
      text: '更新 HTTP 接口 %s 描述为 %s，旧值是 %s',
    },
    groupId: {
      text: '将 HTTP 接口 %s 所在的业务分组调整为 %s，旧值是 %s',
    },
    respoId: {
      text: '修改 HTTP 接口 %s 负责人为 %s，旧值是 %s',
    },
    projectId: {
      text: '将 HTTP 接口 %s 移动至项目 %s，旧值是 %s',
    },
    statusId: {
      text: '修改 HTTP 接口 %s 状态为 %s，旧值是 %s',
    },
    versionName: {
      text: '修改 HTTP 接口 %s 版本名称为 %s，旧值是 %s'
    },
    beforeScript: {
      text: '更新 HTTP 接口 %s 的发送规则为 %s，旧值是 %s'
    },
    afterScript: {
      text: '更新 HTTP 接口 %s 的接收规则为 %s，旧值是 %s'
    },
    watchList: {
      text: '%s %s 了 HTTP 接口 %s'
    },
    schema: {
      text: '更新 HTTP 接口 %s 的出入参规范为 %s，旧值是 %s'
    }
  }
};

module.exports = InterfaceDao;
