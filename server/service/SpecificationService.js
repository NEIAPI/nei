/**
 * Specification Service Class
 */

const _ = require('../util/utility');
const notificatioin = require('./helper/notification');
const Forbidden = require('../error/fe/ForbiddenError');
const dbMap = require('../../common').db;
const _rootFields = ['viewRoot', 'webRoot', 'mockApiRoot', 'mockViewRoot', 'jarRoot'];

class SpecificationService extends require('./ResourceService') {
  constructor(uid, context) {
    super(uid, context);
    this._dao = new (require('../dao/SpecificationDao'))({context});
    this._suDAO = new (require('../dao/SpecificationUserDao'))({context});
    this._sdDAO = new (require('../dao/SpecificationDirectoryDao'))({context});
    this._svDAO = new (require('../dao/SpecificationVarmapDao'))({context});
    this._pgDAO = new (require('../dao/ProGroupDao'))({context});
    this._uDAO = new (require('../dao/UserDao'))({context});
  }

  * _checkBatchPermission(ids) {
    return {
      id: ids[0]
    };
  }

  /**
   * check create permission for user
   *
   * @protected
   * @param  {Number} id - resource id
   * @param  {Object} role - role result
   */
  * _checkCreatePermission(id) {
    return yield super._checkCreatePermission(
      id, {role: {role: 10000, specId: id}}
    );
  }

  /**
   * check whether the user is the onwer of the spec
   * only owner can update or remove the spec
   * @protected
   * @param  {Number} sid - spec id
   * @return  {Object} role - role result
   */
  * _checkIsOwner(sid) {
    let role = {role: -1, specId: 0};
    let spec = yield this._dao.find(sid);
    if (spec && spec.creatorId === this._uid) {
      role = {role: dbMap.SPC_ROL_OWNER, specId: sid, spec};
    }
    return role;
  }

  * _checkUpdatePermission(sid) {
    let role = yield this._checkIsOwner(sid);
    return yield super._checkUpdatePermission(
      sid, {role}
    );
  }

  * _checkRemovePermission(sid) {
    let role = yield this._checkIsOwner(sid);
    return yield super._checkRemovePermission(
      sid, {role}
    );
  }

  /**
   * create a spec record
   *
   * @param {Object} model - spec data
   * @return {db/model/Spec}
   */
  * create(model) {
    yield this._beginTransaction();
    //create the spec
    let ret = yield super.create(Object.assign({}, model, {toolKey: _.uniqueKey()}));
    let id = ret.id;
    //update toolkey
    yield super.update({
      id,
      toolKey: _.getToolKey(id, _.toolKeyType.SPECIFICATION)
    });

    yield this._endTransaction();
    ret = yield this._dao.findDetailWithUserId({id}, this._uid);
    return ret[0];
  }

  /**
   * update a spec record.
   * update directory web as well if relevant web attributes are involved
   *
   * @param {Object} model - spec data
   * @return {db/model/Spec}
   */
  * update(model) {
    let sid = model.id;
    let docIdsSet = new Set();

    Object.keys(model).forEach((it) => {
      let val = model[it];
      if (_rootFields.includes(it)) {
        docIdsSet.add(val);
      }
    });

    //check root node ids
    let docIds = Array.from(docIdsSet);
    docIds = docIds.filter(id => id !== 0);
    if (docIds.length) {
      yield this._sdDAO.checkIds(docIds);
    }

    let opt = {};
    if (model.hasOwnProperty('isShare') && !model.isShare) {
      opt.oprType = 'deShare';
    }
    yield super.update(model, {notification: opt});
    let ret = yield this._dao.findDetailWithUserId({id: sid}, this._uid);
    return ret[0];
  }

  * remove(sid) {
    let quotes = yield this._dao.getQuotes(sid);
    if (quotes.projects.length || quotes.progroups.length) {
      throw new Forbidden('规范被引用，不能删除');
    }
    yield this._beginTransaction();
    let collections = yield this._suDAO.removeBatch({specId: sid});
    let toUserIds = collections.map(item => {
      return item.userId;
    });
    let ret = yield super.remove(sid, {notification: {toUserIds}});

    yield this._endTransaction();
    return ret;
  }

  /**
   * get quote list
   * @param {Number} sid - spec id
   * @return {Object}
   */
  * getQuotes(sid) {
    yield this._checkSearchPermission(sid);
    return yield this._dao.getQuotes(sid);
  }

  /**
   * find spec detail by id
   *
   * @param {Number} sid - spec id
   * @return {db/model/Spec}
   */
  * findDetailById(sid) {
    let ret = yield this.getCanAccessSpecIds();
    if (!ret.ids.includes(sid)) {
      throw new Forbidden(
        `没有访问权限 id:${sid}`, {
          id: sid
        }
      );
    }
    let specs = yield this._dao.findDetailWithUserId({id: sid}, this._uid, ret.specIdMap);
    return specs[0];
  }

  * getCanAccessSpecIds() {
    let [progroups, ownOrSharedSpecs, collectedSpecs] = yield [
      this._pgDAO.getListForUser(this._uid),
      this._dao.search({
        field: {'id': 'DISTINCT'},
        conds: [{creator_id: this._uid}, {is_share: dbMap.CMN_BOL_YES}]
      }),
      this._suDAO.search({
        field: {
          'spec_id': {
            alias: 'id', func: 'DISTINCT'
          }
        },
        conds: {user_id: this._uid}
      })
    ];
    let arr = [...ownOrSharedSpecs, ...collectedSpecs];
    arr = arr.map(it => it.id);

    //帐号来源过滤
    let userInfo = yield this._uDAO.find(this._uid);
    let ifFromOpenID = userInfo.from == dbMap.USR_FRM_OPENID ? 1 : 0;
    let specs = yield this._dao.findBatch(arr);
    let specUserIds = specs.map(item => item.creatorId);
    let specUserInfos = yield this._uDAO.findBatch(specUserIds);
    let filterUserIds = [];
    specUserInfos.forEach(item => {
      let ifFromOpenIDOfSpec = item.from == dbMap.USR_FRM_OPENID ? 1 : 0;
      if (ifFromOpenIDOfSpec != ifFromOpenID) {
        filterUserIds.push(item.id);
      }
    });
    let filterSpecIds = [];
    specs.forEach(item => {
      if (filterUserIds.includes(item.creatorId)) {
        filterSpecIds.push(item.id);
      }
    });
    arr = arr.filter(it => !filterSpecIds.includes(it));

    let dump = function (it, specIdMap, tag) {
      let atts = this._dao.TOOLSPEC;
      atts.forEach((att) => {
        if (!Array.isArray(it)) {
          it = [it];
        }
        it.forEach(item => {
          if (item.hasOwnProperty(att) && item[att]) {
            arr.push(item[att]);
            specIdMap[item[att]] = tag;
          }
        });
      });
    };
    let specIdMap = {};
    progroups.forEach(pg => {
      dump.call(this, pg, specIdMap, 'isFromProgroup');
      dump.call(this, pg.projects, specIdMap, 'isFromProject');
    });
    arr.push(...Object.keys(specIdMap));
    arr = _.uniq(arr);
    return {
      ids: arr,
      specIdMap
    };
  }

  /**
   * get spec list for user
   * @return {db/model/Spec}
   */
  * getListForUser() {
    let ret = yield this.getCanAccessSpecIds();
    let specIdMap = ret.specIdMap;
    let ids = ret.ids;
    let rec = yield this._dao.findDetailWithUserId({id: ids}, this._uid, specIdMap);
    return rec;
  }

  /**
   * collect and uncollect spec
   * @param {Number} sid - spec id
   * @param {Boolean} v - flag to indicate select or unselect
   * @return {db/Model/Spec}
   */
  * favorite(sid, v = true) {
    let spec = (yield this._dao.findDetailWithUserId({id: sid}, this._uid))[0];
    if (v && (spec.creatorId === this._uid || spec.isShare === dbMap.CMN_BOL_NO)) {
      throw new Forbidden('找不到对应规范或自身就是创建者');
    }

    //检查权限
    let ret = yield this.getCanAccessSpecIds();
    let ids = ret.ids;
    if (!ids.includes(sid)) {
      throw new Forbidden('没有权限');
    }

    let opt = {
      userId: this._uid,
      specId: sid
    };
    if (v) {
      //collect the spec
      let collects = yield this._suDAO.search({
        conds: opt
      });
      if (collects.length) {
        throw new Forbidden('已经收藏过该规范');
      }

      yield this._suDAO.create(opt);

      let arg = {
        type: this.constructor.name,
        ids: [sid],
        uid: this._uid,
        oprType: 'collect',
        realUid: spec.creatorId
      };
      this._async(notificatioin.notify, arg);
    } else {
      yield this._suDAO.removeBatch(opt);
    }
    let specs = yield this._dao.findDetailWithUserId({id: sid}, this._uid);
    return specs[0];
  }

  * getSpecs(conds) {
    let ret = yield this._dao.getSpecs(conds);
    return ret;
  }

  /**
   * clone specificatiopn
   * @param {Number} id - spec id
   * @param {String} name - specificatiopn name
   * @return {db/Model/Spec}
   */
  * clone(sid, name) {
    let spec = yield this.findDetailById(sid);
    let data = {
      type: spec.type,
      isShare: dbMap.CMN_BOL_NO,
      isSystem: spec.isSystem,
      name: name,
      language: spec.language,
      description: spec.description,
      document: spec.document,
      creatorId: this._uid,
      argsConfig: spec.argsConfig,
      toolKey: _.getToolKey(_.md5(_.randString(32, false, true)))
    };

    yield this._beginTransaction();
    //create the spec
    let ret = yield super.create(data);
    let id = ret.id;
    //update toolkey
    yield super.update({
      id,
      toolKey: _.getToolKey(id, _.toolKeyType.SPECIFICATION)
    });

    let specIdToRootMap = new Map();
    specIdToRootMap.set(spec.mockApiRoot, 'mockApiRoot');
    specIdToRootMap.set(spec.mockViewRoot, 'mockViewRoot');
    specIdToRootMap.set(spec.viewRoot, 'viewRoot');
    specIdToRootMap.set(spec.webRoot, 'webRoot');
    specIdToRootMap.set(spec.viewExtension, 'viewExtension');
    specIdToRootMap.set(spec.jarRoot, 'jarRoot');
    specIdToRootMap.set(spec.argsConfig, 'argsConfig');
    let updateObj = {
      id,
      engine: spec.engine,
      viewExtension: spec.viewExtension
    };

    // 组装树型目录结构
    let importConstruction = yield this._sdDAO.buildTreeForSpec(sid);
    let stack = importConstruction.roots;

    while (stack.length) {
      // 遍历当前层级中所有节点
      let nodes = [].concat(stack);
      stack = [];

      let addArr = [];
      let counter = 0;
      let counterToAttributeMap = new Map();
      for (let node of nodes) {
        // 伪造成新节点
        let copyNode = Object.assign({}, node);
        delete copyNode.id;
        delete copyNode.children;
        copyNode.specId = id;

        if (node.type === dbMap.SPC_NOD_DIR) {
          // 目录
          stack = stack.concat(node.children);
        }

        let specUpdateAttribute = specIdToRootMap.get(node.id);
        if (!!specUpdateAttribute) {
          counterToAttributeMap.set(counter, specUpdateAttribute);
        }
        counter++;
        addArr.push(copyNode);
      }

      // 将此层级所有结点添加到数据库
      let nodeRet = yield this._sdDAO.createBatch(addArr);

      counterToAttributeMap.forEach((value, key) => {
        updateObj[value] = key + nodeRet[0].id;
      });

      let index = 0;
      for (let node of nodes) {
        if (node.type === dbMap.SPC_NOD_DIR) {
          // 给子节点添加父节点id
          node.children.forEach((item) => {
            item.parent = nodeRet[index].id;
          });
        }
        index++;
      }
    }

    //更新目录
    yield this._dao.update(updateObj);

    // copy varmaps
    let varmaps = yield this._svDAO.search({
      conds: {
        parentType: dbMap.RES_TYP_SPEC,
        parentId: sid
      }
    });

    if (!!varmaps.length) {
      varmaps.map((varmap) => {
        varmap.parentId = id;
        delete varmap.id;
        delete varmap.creator;
        delete varmap.createTime;
      });
      yield this._svDAO.createBatch(varmaps);
    }
    yield this._endTransaction();
    ret = yield this.findDetailById(ret.id);

    return ret;
  }

  * getAllDetailForSpec({key = ''}) {
    let spec = yield this._dao.search({conds: {toolKey: key}});
    if (!spec.length) {
      throw new Forbidden('没有权限');
    }
    spec = spec[0];
    let specId = spec.id;
    let specs = [];
    let ret = yield {
      docsTree: this._sdDAO.buildTreeForSpec(specId),
      varmaps: this._svDAO.search({
        conds: {
          parentId: specId,
          parentType: dbMap.SPC_MAP_SPEC
        }
      })
    };
    specs.push({
      spec,
      docs: ret.docsTree.roots,
      varmaps: ret.varmaps
    });
    return {specs};
  }

  * rtk(sid) {
    let toolKey = _.getToolKey(sid, _.toolKeyType.SPECIFICATION);
    return yield super.update({id: sid, toolKey});
  }
}

module.exports = SpecificationService;
