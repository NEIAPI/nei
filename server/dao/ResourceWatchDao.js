const dt = require('./config/const.json');
const NDao = require('./NDao');

class ResourceWatchDao extends NDao {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/ResourceWatch');
  }

  * getListOfResourceWatch(pid, type) {
    return yield this._doWithCache(
      `${type}${dt.RES_WATCH}${pid}`, function*() {
        let ret = yield this.search({
          conds: {
            resType: type,
            projectId: pid,
          }
        });
        let list = {};
        ret.forEach(item => {
          list[item.resId] = list[item.resId] || [];
          list[item.resId].push(item.userId);
        });
        return list;
      }
    );
  }
}

ResourceWatchDao['__history'] = {
  addText: '关注了 %s 项目组 %s 项目 %s %s',
  delText: '取消关注了 %s 项目组 %s 项目 %s %s'
};

module.exports = ResourceWatchDao;
