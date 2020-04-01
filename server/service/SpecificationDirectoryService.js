/**
 * SpecificationDirectory Service Class
 */
let IllegalRequest = require('../error/fe/IllegalRequestError');
let _ = require('../util/utility');
let fs = require('fs');
let path = require('path');
let sdModel = require('../model/db/SpecificationDirectory');
let dbMap = require('../../common').db;

class Node extends sdModel {
  constructor(obj, children = []) {
    super(obj);
    this.children = children;
  }
}

let dumpNode = function (parr, data, tree, specId) {
  for (let i = 0; i < parr.length; i++) {
    let path = parr[i];
    let children = tree.children;
    if (i === parr.length - 1) {
      // last part of path, i.e. file name
      children.push(new Node(Object.assign(data, {name: path, specId, type: dbMap.SPC_NOD_FILE})));
    } else {
      let children = tree.children = tree.children || [];
      if (!children.some(child => {
          return child.name === path;
        })) {
        children.push(new Node({name: path, specId, type: dbMap.SPC_NOD_DIR}));
      }
      tree = tree.children.filter(child => {
        return child.name === path;
      })[0];
    }
  }
};
// 递归删除文件夹
var rmDir = function (dirPath) {
  let files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    let filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      // 文件夹
      rmDir(filePath);
    } else {
      // 文件
      fs.unlinkSync(filePath);
    }
  });
  fs.rmdirSync(dirPath);
};

class SpecificationDirectoryService extends require('./NService') {
  constructor(uid, context) {
    super(context);
    this._uid = uid;
    this._dao = new (require('../dao/SpecificationDirectoryDao'))({context});
    this._specDAO = new (require('../dao/SpecificationDao'))({context});
    this._svDAO = new (require('../dao/SpecificationVarmapDao'))({context});

    this._specService = new (require('./SpecificationService'))(this._uid, context);
    this._nosService = new (require('./NosService'))(process.appConfig.nos);
  }

  /**
   * check same name conflict and throw exception if conflict exists
   *
   * @param {Object} conds - search conds
   * @return {Boolean}
   */
  * _checkNameConflict(conds) {
    let nodes = yield this._dao.search({conds});
    if (nodes.length) {
      if (nodes.length &&
        nodes.some((node) => {
          return node.name === conds.name; // mysql is case insensitive
        })) {
        throw new IllegalRequest('同目录下已存在同名同类型节点');
      }
    }
  }

  /**
   * check parent node validity(skip root node)
   *
   * @param {Number} pnid - parent node id
   * @param {Number} sid - spec id
   * @return {Void}
   */
  * _checkParentNode(pnid, sid) {
    if (pnid) {
      let node = yield this._dao.find(pnid);
      if (!node || node.type !== dbMap.SPC_NOD_DIR || node.specId !== sid) {
        throw new IllegalRequest('父节点不存在或者不是目录节点');
      }
    }
  }

  /**
   * create a spec directory record
   *
   * @param {Object} model - spec directory data
   * @return {db/model/SpecificationDirectory}
   */
  * create({
    specId,
    parent,
    name,
    type
  }) {
    let model = arguments[0];
    yield this._specService._checkUpdatePermission(specId);
    yield this._checkParentNode(parent, specId);
    yield this._checkNameConflict({name, type, parent, specId});
    let ret = yield super.create(model);
    return ret;
  }

  * _dumpAtEachDepth(tree, files) {
    if (!tree.hasOwnProperty('name')) {
      return;
    }
    let {children} = _.filterObj(tree, 'children');
    if (tree.type === dbMap.SPC_NOD_FILE) {
      files.push(tree);
      return;
    }
    let node = yield this._dao.create(tree);
    if (children) {
      for (let child of children) {
        child.parent = node;
        yield this._dumpAtEachDepth(child, files);
      }
    }
  }

  * addNodeList({
    items,
    specId,
    parent = 0,
    isDir
  }) {
    yield this._specService._checkUpdatePermission(specId);
    yield this._checkParentNode(parent, specId);
    yield this._beginTransaction();
    if (isDir) {
      let tree = {},
        files = [];
      // directory upload
      for (let item of items) {
        let {filePath} = _.filterObj(item, 'filePath'); // file path
        let parr = filePath.split('/');
        let root = parr.shift();
        if (!tree.hasOwnProperty('name')) {
          tree = new Node({name: root, parent, specId, type: dbMap.SPC_NOD_DIR});
        }
        dumpNode(parr, item, tree, specId);
      }
      yield this._checkNameConflict({name: tree.name, type: tree.type, parent, specId});
      yield this._dumpAtEachDepth(tree, files, specId);
      yield super.createBatch(files);
    } else {
      // file upload
      for (let item of items) {
        delete item.filePath;
        item.specId = specId;
        item.parent = parent;
      }
      yield super.createBatch(items);
    }
    yield this._endTransaction();
    let docs = yield this._dao.findNode(specId, parent);
    return docs;
  }

  * update(nodeId, {
    name,
    dataSource
  }) {
    let data = arguments[1];
    let doc = yield this._dao.find(nodeId);
    if (!doc) {
      throw new IllegalRequest('没有对应的节点');
    }

    let specId = doc.specId;
    let {spec} = yield this._specService._checkUpdatePermission(specId);

    if (name) {
      yield this._checkNameConflict({name, type: doc.type, parent: doc.parent, specId});
    }

    yield this._beginTransaction();
    if (dataSource && nodeId == spec.argsConfig) {
      // 修改数据来源需要清掉作为命令行参数配置文件的设置
      yield this._specDAO.update({id: specId, argsConfig: 0});
    }

    doc = yield super.update(Object.assign({id: nodeId}, data));
    yield this._endTransaction();
    return doc;
  }

  * removeBatch(ids) {
    let docs = yield this._dao.checkIds(ids);

    let specId = docs[0].specId;
    yield this._specService._checkUpdatePermission(specId);

    let {map} = yield this._dao.buildTreeForSpec(specId);

    let nodes = ids.map(id => {
      return map[id];
    });
    let idSet = new Set();
    for (let node of nodes) {
      let stack = [];
      stack.push(node);
      while (stack.length) {
        let node = stack.pop();
        idSet.add(node.id);
        let children = node.children || [];
        children.forEach((child) => {
          stack.push(child);
        });
      }
    }

    ids = Array.from(idSet);
    let ret = yield super.removeBatch(ids);

    return ret;
  }

  /**
   * clear all nodes in the spec
   *
   * @param {Number} specId - spec id
   * @return {db/model/Specification}
   */
  * empty(specId) {
    let {spec} = yield this._specService._checkUpdatePermission(specId);
    yield this._dao.removeBatch({specId});
    return spec;
  }

  /**
   * get nos token for uploading non-text files
   * @param  n - number of token
   * @return [Array Object]
   */
  getToken(n) {
    let ret = [];
    for (let i = 0; i < n; i++) {
      let key = _.uniqueKey();
      ret.push({
        token: this._nosService._getToken(key),
        key
      });
    }
    return ret;
  }

  /**
   * find nodes two levels down
   *
   * @param {Number} sid - spec id
   * @param {Number} parent - parent node id
   * @param {Number} level - how deep down the tree
   * @return {Array db/model/SpecificationDirectory}
   */
  * findNode(sid, parent) {
    yield this._specService._checkSearchPermission(sid);
    return yield this._dao.findNode(sid, parent);
  }

  /**
   * move nodes around - i.e. change parent id.
   *
   * @param {Number} sid - spec id
   * @param {Number} ids - ids of the nodes to be moved
   * @param {Number} toId - new parent node
   * @return {Array db/model/SpecificationDirectory}
   */
  * moveNode(sid, ids, toId) {
    yield this._specService._checkUpdatePermission(sid);
    yield this._checkParentNode(toId, sid);
    let docs = yield this._dao.checkIds(ids);

    let dirStmt = {name: [], type: dbMap.SPC_NOD_DIR, parent: toId, specId: sid};
    let fileStmt = {name: [], type: dbMap.SPC_NOD_FILE, parent: toId, specId: sid};
    docs.forEach((doc) => {
      if (doc.type === dbMap.SPC_NOD_DIR) {
        dirStmt.name.push(doc.name);
      } else {
        fileStmt.name.push(doc.name);
      }
    });
    let conds = [];
    if (dirStmt.name.length) {
      conds.push(dirStmt);
    }
    if (fileStmt.name.length) {
      conds.push(fileStmt);
    }
    if (conds.length) {
      yield this._checkNameConflict(conds);
    }

    let ret = yield this._dao.updateBatch({parent: toId}, {id: ids});
    return ret;
  }

  /**
   * import specificatiopn
   * @param {Number} specId - spec id
   * @param {Number} importSpecId - spec id
   * @return {db/Model/Spec}
   */
  * import({
    specId,
    importSpecId
  }) {
    let targetSpec = yield this._specService.findDetailById(specId);

    let spec = yield this._specDAO.find(importSpecId);
    if (spec.isSystem !== 1) {
      throw new Forbidden(`您选择的不是有效的系统内置规范 id:${importSpecId}`, {id: importSpecId});
    }
    let specIdToRootMap = new Map();
    specIdToRootMap.set(spec.mockApiRoot, 'mockApiRoot');
    specIdToRootMap.set(spec.mockViewRoot, 'mockViewRoot');
    specIdToRootMap.set(spec.viewRoot, 'viewRoot');
    specIdToRootMap.set(spec.webRoot, 'webRoot');
    specIdToRootMap.set(spec.viewExtension, 'viewExtension');
    specIdToRootMap.set(spec.jarRoot, 'jarRoot');
    specIdToRootMap.set(spec.argsConfig, 'argsConfig');
    let updateObj = {
      id: specId,
      engine: spec.engine,
      viewExtension: spec.viewExtension
    };

    // 组装树型目录结构
    let importConstruction = yield this._dao.buildTreeForSpec(importSpecId);
    let stack = importConstruction.roots;

    yield this._beginTransaction();

    // 删除原有规范节点
    yield this._dao.removeBatch({specId});

    while (stack.length) {
      // 遍历当前层级中所有节点
      let nodes = [].concat(stack);
      let argsConfigOrder;
      stack = [];

      let addArr = [];
      let counter = 0;
      let counterToAttributeMap = new Map();
      for (let node of nodes) {
        // 伪造成新节点
        let copyNode = Object.assign({}, node);
        delete copyNode.id;
        delete copyNode.children;
        copyNode.specId = specId;

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
      let nodeRet = yield this._dao.createBatch(addArr);

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
    yield this._specDAO.update(updateObj);

    yield this._endTransaction();
    targetSpec = yield this._specService.findDetailById(specId);
    let nodes = yield this.findNode(specId, 0);

    return {tree: nodes, spec: targetSpec};
  }

  /**
   * import specificatiopn from zip
   * @param {Number} specId - spec id
   * @param {String} filePath - file path
   * @return {db/Model/Spec}
   */
  * importFromZip({
    specId,
    filePath
  }) {
    let spec = yield this._specService.findDetailById(specId);
    let newFilePath = `${filePath}.zip`;
    fs.renameSync(filePath, newFilePath); // 重命名，追加.zip后缀
    let unzipObj = yield _.getZipMap(newFilePath);
    let stack = unzipObj.fileList;
    let zipPath = unzipObj.zipPath;
    let binArr = [];
    const NEI_CONFIG_JSON = 'nei.config.json';

    stack.forEach((item) => {
      item.parentId = 0;
    }); // 给所有根节点元素的父节点置为0

    //查找配置文件并过滤
    let config;
    stack = stack.filter((item) => {
      if (item.name == NEI_CONFIG_JSON) {
        config = {isNormal: true, data: item};
      }
      return item.name !== NEI_CONFIG_JSON;
    });
    if (stack.length === 1 && !config) {
      stack[0].sub = stack[0].sub.filter((item) => {
        if (item.name == NEI_CONFIG_JSON) {
          config = {isNormal: false, data: item};
        }
        return item.name != NEI_CONFIG_JSON;
      });
    }

    // 开始事务
    yield this._beginTransaction();

    // 删除原有规范节点
    yield this.empty(specId);

    while (stack.length) {
      // 遍历当前层级中所有节点
      let nodes = [].concat(stack);
      stack = [];

      let addArr = [];
      for (let node of nodes) {
        if (node.isDir) {
          // 目录
          stack = stack.concat(node.sub);
          addArr.push({
            parent: node.parentId,
            specId: specId,
            type: dbMap.SPC_NOD_DIR,
            name: node.name,
            mime: '',
            content: ''
          });
        } else {
          // 文件
          if (!node.isText) {
            // 针对二进制文件，需要生成唯一key
            let key = _.uniqueKey();
            node.key = key;
          }

          addArr.push({
            parent: node.parentId,
            specId: specId,
            type: dbMap.SPC_NOD_FILE,
            name: node.name,
            mime: node.mime,
            content: node.isText ? node.content : this._nosService.getUrl(node.key)
          });

          if (!node.isText) {
            // 缓存二进制文件节点
            binArr.push(node);
          }
        }
      }

      // 将此层级所有结点添加到数据库
      let ret = yield this._dao.createBatch(addArr);
      let firstId = ret[0].id;
      for (let node of nodes) {
        let nodeId = firstId++;
        if (node.isDir) {
          // 给子节点添加父节点id
          node.sub.forEach((item) => {
            item.parentId = nodeId;
          });
        }
      }
    }

    // 处理二进制文件
    let promiseArr = binArr.map((it) => {
      return this._nosService.upload(it.path, it.key);
    });
    yield promiseArr;

    // 删除解压出来的文件
    rmDir(zipPath);

    let nodeNeedUpdateArray = [];
    let data = {};

    let configDocs = function (configs, trees) {
      for (let tree of trees) {
        let config = configs.find((item) => {
          return item.name == tree.name;
        });
        if (config) {
          if (config.isMockApiRoot) {
            data.mockApiRoot = tree.id;
          }
          if (config.isMockViewRoot) {
            data.mockViewRoot = tree.id;
          }
          if (config.isWebRoot) {
            data.webRoot = tree.id;
          }
          if (config.isViewRoot) {
            data.viewRoot = tree.id;
          }
          if (config.isArgsConfig) {
            data.argsConfig = tree.id;
          }
          if (config.isJarRoot) {
            data.jarRoot = tree.id;
          }

          if (config.description || config.dataSource) {
            let nodeNeedUpdate = {id: tree.id};
            if (config.description) {
              nodeNeedUpdate.description = config.description;
            }
            if (config.dataSource) {
              nodeNeedUpdate.dataSource = config.dataSource;
            }
            nodeNeedUpdateArray.push(nodeNeedUpdate);
          }
          if (tree.children && tree.children.length && config.childrenConfigs && config.childrenConfigs.length) {
            configDocs(config.childrenConfigs, tree.children);
          }
        }
      }
    };

    //导入配置信息
    if (config && config.data && config.data.content) {
      let importConstruction = yield this._dao.buildTreeForSpec(specId);
      let specTree = importConstruction.roots;
      let configJson = JSON.parse(config.data.content);

      if (!config.isNormal && specTree.length) {
        specTree = specTree[0].children || [];
      }

      let configs = configJson.configs || [];
      let varmaps = configJson.varmaps || [];

      configDocs(configs, specTree);

      //还原规范配置信息
      if (Object.keys(data).length) {
        yield this._specDAO.update(Object.assign(data, {id: specId}));
      }

      if (nodeNeedUpdateArray.length) {
        for (let updateObj of nodeNeedUpdateArray) {
          yield this._dao.update(updateObj);
        }
      }

      if (varmaps.length) {
        let varmaps = [];
        for (let varmap of varmaps) {
          //判断是否存在
          let oldVarmaps = yield this._svDAO.search({
            conds: {
              parentId: specId,
              parentType: dbMap.SPC_MAP_SPEC,
              orgName: varmap.orgName
            }
          });
          if (!oldVarmaps.length) {
            varmap.parentId = specId;
            varmap.parentType = dbMap.SPC_MAP_SPEC;
            varmap.type = spec.type;
            varmap.creatorId = this._uid;
            varmaps.push(varmap);
          }
        }
        if (varmaps.length) {
          yield this._svDAO.createBatch(varmap);
        }
      }
    }
    yield this._endTransaction();

    spec = yield this._specService.findDetailById(specId);
    let nodes = yield this.findNode(specId, 0);
    return {tree: nodes, spec};
  }

  /**
   * export specificatiopn
   * @param {Number} specId - spec id
   * @return {db/Model/Spec}
   */
  * export(specId) {
    let spec = yield this._specService.findDetailById(specId);

    let TEXT_REGEX = /^(text\/.+)|(application\/json)$/;

    let output = function (file, content) {
      //写入文件
      fs.writeFileSync(file, content);
    };

    let mkDir = function (dir) {
      //创建文件夹
      try {
        fs.accessSync(dir);
      } catch (ex) {
        fs.mkdirSync(dir);
      }
    };

    let genDocs = function*(docs, dir) {
      for (let doc of docs) {
        if (doc.type === dbMap.SPC_NOD_FILE) {
          // 先判断文件是否是非文本
          if (!TEXT_REGEX.test(doc.mime)) {
            let file = path.join(dir, doc.name);
            yield this._nosService.download(file, doc.content);
          } else {
            // 普通文件, 没有数据源
            let file = path.join(dir, doc.name);
            let content = doc.content;
            output(file, content);
          }
        } else {
          // 目录
          let file = path.join(dir, doc.name);
          mkDir(file);
          yield genDocs.call(this, doc.children, file);
        }
      }
    };
    let genConfigs = function (docs, dir) {
      let configs = [];
      for (let doc of docs) {
        let config = {};
        //写配置
        config.name = doc.name;

        if (doc.description) {
          config.description = doc.description;
        }
        if (doc.dataSource !== dbMap.SPC_DTS_NONE) {
          config.dataSource = doc.dataSource;
        }

        if (doc.id == spec.mockApiRoot) {
          config.isMockApiRoot = true;
        }
        if (doc.id == spec.mockViewRoot) {
          config.isMockViewRoot = true;
        }
        if (doc.id == spec.webRoot) {
          config.isWebRoot = true;
        }
        if (doc.id == spec.viewRoot) {
          config.isViewRoot = true;
        }
        if (doc.id == spec.jarRoot) {
          config.isJarRoot = true;
        }
        if (spec.argsConfig && spec.argsConfig == doc.id) {
          config.isArgsConfig = true;
        }

        if (doc.type === dbMap.SPC_NOD_DIR) {
          //
          let file = path.join(dir, doc.name);
          let childrenRet = genConfigs(doc.children, file);
          config.childrenConfigs = childrenRet;
        }
        configs.push(config);
      }
      return configs;
    };

    let insertSub = function (parentDir) {
      let subs = fs.readdirSync(path.join(rootDir, parentDir));
      subs.forEach(function (fileName) {
        let filePath = path.join(rootDir, path.join(parentDir, fileName)); // 读取到文件路径
        let stat = fs.statSync(filePath);
        if (stat.isFile()) {
          zip.folder(parentDir).file(fileName, fs.readFileSync(filePath));
        } else if (stat.isDirectory()) {
          zip.folder(path.join(parentDir, fileName));
          insertSub(path.join(parentDir, fileName));
        }
      });
    };

    // 组装树型目录结构
    let importConstruction = yield this._dao.buildTreeForSpec(specId);
    let docs = importConstruction.roots;
    //创建根文件夹
    let downloadDir = path.join(this._context.app.config.roots.appRoot, this._context.app.config.roots.downloadRoot);
    try {
      fs.accessSync(downloadDir);
    } catch (ex) {
      fs.mkdirSync(downloadDir);
    }
    let dirName = spec.name + '_' + _.getToolKey(specId, _.toolKeyType.SPECIFICATION);
    let rootDir = path.join(downloadDir, dirName);

    //压缩文件夹
    let zip = new require('jszip')();
    try {
      mkDir(rootDir);
      //组装文件目录
      yield genDocs.call(this, docs, rootDir);

      //创建配置文件
      let configs = genConfigs(docs, rootDir);
      //获取规范变量映射数据

      let varmaps = yield this._svDAO.search({
        conds: {
          parentId: specId,
          parentType: dbMap.SPC_MAP_SPEC
        }
      });
      varmaps = varmaps.map((item) => {
        return {orgName: item.orgName, varName: item.varName};
      });

      fs.writeFileSync(path.join(rootDir, 'nei.config.json'), JSON.stringify({configs, varmaps}));

      insertSub('');
      //写入压缩文件
      let data = yield zip.generateAsync({type: 'nodebuffer', platform: process.platform.toLowerCase()});
      //fs.writeFileSync(rootDir+'.zip', data, 'binary');
      return {name: spec.name + '.zip', data};
    } catch (err) {
      throw new IllegalRequest('导出规范发生异常');
    } finally {
      //删除文件夹
      rmDir(rootDir);
    }
  }
}

module.exports = SpecificationDirectoryService;
