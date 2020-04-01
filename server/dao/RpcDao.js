const db = require('../../common').db;
const ResourceDao = require('./ResourceDao');

class RpcDao extends ResourceDao {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_RPC
    }, sqlOpt);
    this._Model = require('../model/db/Interface');
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
      'tag_pinyin', 'status_id', 'path', 'method', 'create_time'
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
      type: db.INTERFACE_TYP_RPC
    };
  };
}

RpcDao['__updateJoins'] = [{
  table: 'status',
  alias: 'status',
  fkmap: {id: 'status_id'},
  field: ['id', 'name', 'name_pinyin']
}];

RpcDao['__history'] = {
  addText: '新增 RPC 接口 %s',
  delText: '删除 RPC 接口 %s',
  shareText: '分享 RPC 接口 %s',
  resType: db.RES_TYP_RPC,
  updateText: {
    name: {
      text: '更新 RPC 接口 %s 的名称为 %s，旧值是 %s'
    },
    className: {
      text: '更新 RPC 接口 %s 的类名为 %s，旧值是 %s'
    },
    path: {
      text: '更新 RPC 接口 %s 的方法名为 %s，旧值是 %s'
    },
    tag: {
      text: '更新 RPC 接口 %s 标签为 %s，旧值是 %s'
    },
    reqFormat: {
      text: '更新 RPC 接口 %s 请求参数类型为 %s，旧值是 %s',
    },
    resFormat: {
      text: '更新 RPC 接口 %s 响应结果类型为 %s，旧值是 %s',
    },
    description: {
      text: '更新 RPC 接口 %s 描述为 %s，旧值是 %s',
    },
    groupId: {
      text: '将 RPC 接口 %s 所在的业务分组调整为 %s，旧值是 %s',
    },
    respoId: {
      text: '修改 RPC 接口 %s 负责人为 %s，旧值是 %s',
    },
    projectId: {
      text: '将 RPC 接口 %s 移动至项目 %s，旧值是 %s',
    },
    statusId: {
      text: '修改 RPC 接口 %s 状态为 %s，旧值是 %s',
    },
    versionName: {
      text: '修改 RPC 接口 %s 版本名称为 %s，旧值是 %s'
    },
    watchList: {
      text: '%s %s 了 RPC 接口 %s'
    }
  }
};

module.exports = RpcDao;
