const log = require('../util/log');
const utility = require('../util/utility');
const dbMap = require('../../common').db;
const NService = require('./NService');
const InterfaceDao = require('../dao/InterfaceDao');
const ProjectDao = require('../dao/ProjectDao');

class ResourceViewHistoryService extends NService {
  constructor(uid, context) {
    super();
    this._dao = new (require('../dao/ResourceViewHistoryDao'))({context});
    this._interfaceDao = new InterfaceDao();
    this._projectDao = new ProjectDao();
  }

  * create(model) {
    yield this._beginTransaction();
    yield super.createBatch([model]);
    yield this._endTransaction();
  }

  /**
   * 资源查看历史
   * @return {Array}
   */
  * getListForUser(uid) {
    log.debug(
      '[%s.getListForUser] - get resource view history list for user %d',
      this.constructor.name, uid
    );

    let ret = yield this._dao.search({
      conds: {
        user_id: uid,
        create_time: {
          op: '>=',
          // 一个月之内的记录
          value: utility.format(Date.now() - 2592000000)
        }
      },
      order: {field: 'create_time', desc: true},
    });
    // 按照 resId 进行分组并计数
    const list = [];
    const itemsMap = {};
    const resIds = [];
    const projectIds = [];
    ret.forEach(item => {
      // 最多显示20条
      if (resIds.length < 20) {
        if (itemsMap[item.resId]) {
          const existItem = list.find(it => it.resId === item.resId);
          existItem.viewCount += 1;
        } else {
          itemsMap[item.resId] = 1;
          item.viewCount = 1;
          list.push(item);
          resIds.push(item.resId);
          projectIds.push(item.projectId);
        }
      }
    });
    const resources = yield this._interfaceDao.findBatch(resIds);
    const projects = yield this._projectDao.findBatch(projectIds);
    const result = [];
    list.forEach(item => {
      const resData = resources.find(it => it.id === item.resId);
      if (resData) {
        result.push({
          id: item.id,
          resType: item.resType,
          project: projects.find(it => it.id === item.projectId),
          resData,
          viewCount: item.viewCount,
          createTime: item.createTime,
        });
      }
    });
    return result;
  }
}

module.exports = ResourceViewHistoryService;
