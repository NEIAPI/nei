const db = require('../../common').db;

class SpecificationDirectoryDao extends require('./NDao') {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/SpecificationDirectory');
  }

  /**
   * build tree structure for spec
   * @param {Number} sid - spec id
   * @return {Object} {map, roots} - map: all nodes, root nodes
   */
  * buildTreeForSpec(sid) {
    let nodes = yield this.search({conds: {specId: sid}});
    let roots = [];
    let map = {};
    nodes.forEach((it) => {
      it.children = [];
      map[it.id] = it;
    });
    Object.keys(map).forEach((nodeId) => {
      let node = map[nodeId];
      let parent = node.parent;
      if (parent) {
        map[parent].children.push(node);
      } else {
        roots.push(node);
      }
    });
    return {roots, map};
  }

  /**
   * find nodes two levels down
   *
   * @param {Number} sid - spec id
   * @param {Number} parent - parent node id
   * @param {Number} level - how deep down the tree
   * @return {Array db/model/SpecificationDirectory}
   */
  * findNode(sid, parent, level = 2) {
    let ret,
      currentLevel;
    ret = currentLevel = yield this.search({
      conds: {specId: sid, parent}
    }) || [];
    while (level && currentLevel.length) {
      // go one level down
      let ids = currentLevel.map(node => node.id);
      let children = yield this.search({
        conds: {specId: sid, parent: ids}
      }) || [];
      currentLevel.map(node => {
        node.children = children.filter(child => {
            return child.parent === node.id;
          }) || [];
        node.hasChildren = !!node.children.length;
        return node;
      });
      currentLevel = children;
      level--;
    }
    return ret;
  }
}


SpecificationDirectoryDao['__history'] = {
  addText: '在%s工程规范 %s 中的%s下添加%s%s',
  delText: '在%s工程规范 %s 中删除%s下的%s%s',
  emptyText: '清空了%s工程规范 %s 的目录结构',
  importZipText: '在%s工程规范 %s 中上传了工程结构',
  importSystemText: '将 %s 工程结构导入了%s工程规范 %s 中',
  dirUploadText: '在%s工程规范 %s 中的 %s 下上传%s%s',
  updateText: {
    dataSource: {
      text: '在%s工程规范 %s 中修改了%s %s 的填充数据模型类别'
    },
    content: {
      text: '在%s工程规范 %s 中修改了%s %s 的内容'
    },
    description: {
      text: '在%s工程规范 %s 中修改了%s %s 的描述'
    },
    name: {
      text: '在%s工程规范 %s 中修改了%s %s 的名字'
    }
  },
  resType: db.RES_TYP_SPEC
};

module.exports = SpecificationDirectoryDao;
