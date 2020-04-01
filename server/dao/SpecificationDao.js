const db = require('../../common').db;
const _ = require('../util/utility');

class SpecificationDao extends require('./ResourceDao') {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_SPEC,
      owner: 'creatorId',
      defOwner: db.USR_ADMIN_ID
    }, sqlOpt);
    this._Model = require('../model/db/Specification');
    this._suDAO = new (require('./SpecificationUserDao'))(sqlOpt);
    this._pgDAO = new (require('../dao/ProGroupDao'))(sqlOpt);
    this._pDAO = new (require('../dao/ProjectDao'))(sqlOpt);
    this._uDAO = new (require('../dao/UserDao'))(sqlOpt);
  }

  /**
   * get role between user and spec, return -1 if no permission
   *
   * @param  {Number} id  - spec id
   * @param  {Number} uid - user id
   * @return {Object} role info between user and spec, e.g. {role:-1, specId:0, otherRoles: []}
   */
  * getRoleOfUser(id, uid) {
    let roles = [];

    let [owner, shared, collector, progroups] = yield [
      this.search({
        conds: {id, creatorId: uid},
      }), // check owned specs
      this.search({
        conds: {id, isShare: db.CMN_BOL_YES}
      }), // check shared spec
      this._suDAO.search({
        conds: {userId: uid, specId: id}
      }), // check spec collection
      this._pgDAO.getListForUser(uid) // check progroup and project specs
    ];

    let atts = this.TOOLSPEC;
    let isBundle = (progroups || []).some(pg => {
      return _.contains(pg, atts, id) ||
        (pg.projects || []).some((pro) => {
          return _.contains(pro, atts, id);
        });
    });

    // order matters!
    if (owner.length) {
      roles.push(db.SPC_ROL_OWNER);
    }
    if (shared.length) {
      //帐号来源过滤
      let users = yield this._uDAO.findBatch([shared[0].creatorId, uid]);
      let fromOpenID = [];
      users.forEach(item => {
        if (item.from == db.USR_FRM_OPENID) {
          fromOpenID.push(item.id);
        }
      });
      if (!(fromOpenID.length == 1 && users.length == 2)) {
        roles.push(db.SPC_ROL_OBSERVER);
      }
    }
    if (isBundle) {
      roles.push(db.SPC_ROL_USER);
    }
    if (collector.length) {
      roles.push(db.SPC_ROL_COLLECTOR);
    }

    if (roles.length > 0) {
      return {
        role: roles.shift(),
        specId: id,
        otherRoles: roles || []
      };
    }

    if (uid === db.USR_ADMIN_ID) {
      return {
        role: db.SPC_ROL_OWNER,
        specId: id,
        otherRoles: []
      };
    }

    return {role: -1, specId: 0};
  }

  /**
   * find detail by specification id
   * @param  {Number} sid - spec id
   * @param  {Number} uid - user id
   * @return {db/model/specification}
   */
  * findDetailWithUserId(conds, uid, specIdMap = {}) {
    let specs = yield this.search({
      conds,
      sfields: Object.keys(this._Model.getField()),
      field: {
        'su.user_id': {alias: 'favouriteCount', func: 'count'},
        'msu.user_id, 1,0': {alias: 'isFavorite', func: 'if'}
      },
      group: ['id'],
      joins: this._getUserJoins().concat(
        [{
          table: 'specification_user',
          alias: 'su',
          fkmap: {spec_id: 'id'},
          type: 'LEFT',
        }, {
          table: 'specification_user',
          alias: 'msu',
          fkmap: {
            spec_id: 'id',
            user_id: {type: 'self', op: '=', value: uid}
          },
          type: 'LEFT'
        }]
      )
    });
    //添加标记
    specs.forEach(spec => {
      if (specIdMap[spec.id]) {
        spec[specIdMap[spec.id]] = db.CMN_BOL_YES;
      }
    });
    return specs;
  }

  * findCollectAndCreateSpecIds(userId) {
    let specsArr = yield [
      this.search({
        conds: {
          creatorId: userId
        }
      }),
      this.search({
        joins: [{
          table: 'specification_user',
          fkmap: {spec_id: 'id'},
          type: 'LEFT',
          conds: {
            userId
          }
        }]
      }),
    ];
    let specIds = [];
    specsArr.forEach(specs => {
      specs.forEach(spec => {
        if (!specIds.includes(spec.id)) {
          specIds.push(spec.id);
        }
      });
    });
    return specIds;
  }

  /**
   * get quote list
   * @param {Number} sid - spec id
   * @return {Object}
   */
  * getQuotes(sid) {
    let [projects, progroups] = yield [
      this._pDAO.getListBySpecId(sid),
      this._pgDAO.getListBySpecId(sid)
    ];
    return {
      projects: projects || [],
      progroups: progroups || []
    };
  }


  /**
   * get specs
   * @param  {Object} conds - conditions
   * @return {model/db/Specification} specification model
   */
  * getSpecs(conds) {
    let specs = yield this.search({
      conds,
      joins: this._getUserJoins()
    });

    let favourites = yield this._suDAO.search({
      conds: {
        'spec_id': specs.map((spec) => {
          return spec.id;
        })
      },
      joins: [{
        table: 'specification',
        alias: 'favourite_user',
        fkmap: {'id': 'spec_id'},
      }]
    });

    favourites.forEach((fav) => {
      specs.forEach((spec) => {
        if (fav.specId === spec.id) {
          if (!!spec.favUsers) {
            spec.favUsers.push(fav.userId);
          } else {
            spec.favUsers = [fav.userId];
          }
        }
      });
    });
    return specs;
  }
}

SpecificationDao['__history'] = {
  addText: '新建%s工程规范%s',
  delText: '删除%s工程规范%s',
  updateText: {
    name: {
      text: '更新%s工程规范 %s 名称为 %s'
    },
    description: {
      text: '更新%s工程规范 %s 描述为 %s'
    },
    language: {
      text: '调整%s工程规范 %s 的实现语言为 %s'
    },
    engine: {
      text: '调整%s工程规范 %s 的模板引擎为 %s'
    },
    isLock: {
      text: '调整%s工程规范 %s 的锁定状态为 %s'
    },
    isShare: {
      text: '%s%s工程规范 %s'
    },
    document: {
      text: '调整%s工程规范 %s 的文档为 %s',
    },
    viewExtension: {
      text: '更新%s工程规范 %s 的模板文件扩展名为 %s'
    },
    toolKey: {
      text: '修改%s工程规范 %s 的工具标识为 %s'
    },
    viewRoot: {
      text: '设置%s工程规范 %s 的后端模板根目录为目录%s',
    },
    webRoot: {
      text: '设置%s工程规范 %s 的静态资源根目录为目录%s',
    },
    mockApiRoot: {
      text: '设置%s工程规范 %s 的接口MOCK数据根目录为目录%s',
    },
    mockViewRoot: {
      text: '设置%s工程规范 %s 的模板MOCK数据根目录为目录%s',
    }
  },
  resType: db.RES_TYP_SPEC
};

module.exports = SpecificationDao;
