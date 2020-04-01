const db = require('../../common').db;

const ResourceDao = require('./ResourceDao');

class ResourceVersionDao extends ResourceDao {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_VERSION
    }, sqlOpt);
    this._Model = require('../model/db/ResourceVersion');
  }

  * getListByProjectAndResType(projectId, resType) {
    return yield this.search({
      conds: {
        projectId: projectId,
        resType: resType
      }
    });
  }

  * getListByResId(resIds, resType) {
    return yield this.search({
      conds: {
        res_type: resType,
      },
      joins: [
        {
          table: 'resource_version',
          fkmap: {'origin': 'origin'},
          alias: 'rv2',
          conds: {
            res_type: resType,
            res_id: resIds
          }

        }]
    });

  }

  * removeBatch({resId, resType}) {
    let list = yield super.removeBatch({resId, resType});
//         这是获取到删除掉的origin
    let origins = list.map(item => {
      return item.origin;
    });

    let originCnts = yield this.search({
      sfields: ['origin'],
      conds: {
        origin: origins,
        resType: resType
      },
      group: ['origin'],
      field: {
        creatorId: {
          func: 'count',
          alias: 'cnt'
        }
      },
    });

    let toRemoveSet = new Set();
    for (let item of originCnts) {
      if (item.cnt == 1) {
        toRemoveSet.add(item.origin);
      }
    }
    let list2 = yield super.removeBatch({origin: Array.from(toRemoveSet), resType: resType});

    return list;
  }

}

ResourceVersionDao['__history'] = {
  addText: '创建了 %s 项目组 %s 项目 %s %s 的新版本 %s',
  delText: '删除了 %s 项目组 %s 项目 %s %s 的版本 %s'
};
module.exports = ResourceVersionDao;
