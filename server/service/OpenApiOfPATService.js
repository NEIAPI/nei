const _ = require('lodash');
const log = require('../util/log');
const dbMap = require('../../common').db;
const Forbidden = require('../error/fe/ForbiddenError');
const InvalidError = require('../error/fe/InvalidError');
const crypto = require('crypto');
const UserService = require('./UserService');
const co = require('co');
const IllegalRequestError = require('../error/fe/IllegalRequestError');
const NService = require('./NService');
const InterfaceService = require('./InterfaceService');
const ConstraintService = require('./ConstraintService');
const DatatypeService = require('./DataTypeService');
const RpcService = require('./RpcService');

class OpenApiOfPATService extends NService {
  constructor(uid, context) {
    super(context);
    this._userService = new UserService(context);
    this.datatypeService = new DatatypeService(uid, context);
    this.interfaceService = new InterfaceService(uid, context);
    this._progroupDao = new (require('../dao/ProGroupDao'))({context});
    this._pgApiSpecDAO = new (require('../dao/ProGroupApiSpecDao'))({context});
    this._projectDao = new (require('../dao/ProjectDao'))({context});
  }

  static checkRead(pat) {
    const privileges = _.padStart(pat.privilege.toString(2), 2, 0).split('');
    if (privileges[0] === '1') {
      return true;
    }
    throw new Forbidden('没有读权限，请检查访问令牌设置');
  }

  static checkWrite(pat) {
    const privileges = _.padStart(pat.privilege.toString(2), 2, 0).split('');
    if (privileges[1] === '1') {
      return true;
    }
    throw new Forbidden('没有写权限，请检查访问令牌设置');
  }

  /**
   *  根据pat获取用户的项目组列表
   * @param pat {object} pat 对象
   * @property data.private_token {string} token
   * @return {Array|Object|Progroup}
   */
  * getProgroups(pat) {
    OpenApiOfPATService.checkRead(pat);
    return yield this._progroupDao.getListForUser(pat.creatorId);
  }

  /**
   *  根据项目组id 获取项目列表
   * @param pgid {number} 项目组id
   * @param pat {object} pat 对象
   * @return {Array|Object|Project}
   */
  * getProjectsByPgid(pgid, pat) {
    // 需要验证用户是否有查看该项目组的权限
    const progroups = yield this.getProgroups(pat);
    if (!progroups.find(pg => pg.id === pgid)) {
      throw new Forbidden('项目组不存在，请检查项目组 id 是否正确');
    }
    return yield this._projectDao.getListByProgroupId(pgid);
  }

  /**
   * 根据项目 id 获取项目信息
   * @param pid {Number} 项目 id
   * @param pat {object} pat 对象
   * @param checkRead {Boolean} 是否需要检查 读 权限
   * @return {Array|Object|Project}
   */
  * getProjectById(pid, pat, checkRead = true) {
    if (checkRead) {
      OpenApiOfPATService.checkRead(pat);
    }
    const projects = yield this._projectDao.getListForUser(pat.creatorId, {});
    const project = projects.find(pro => pro.id === pid);
    if (!project) {
      throw new Forbidden('项目不存在，请检查项目 id 是否正确');
    }
    return project;
  }

  /**
   *  根据项目id获取接口列表
   * @param data {object} 查询参数
   * @property data.pid {number} 项目id
   * @property data.excludeShared {boolean} 是否移除公共资源库中的接口
   * @param pat {object} pat
   * @return {Array|Object|Interfaces}
   */
  * getInterfacesByPid(data, pat) {
    OpenApiOfPATService.checkRead(pat);
    const interfaceService = new InterfaceService(pat.creatorId, this._context);
    // getListInProject 会校验查看权限
    const interfaces = yield interfaceService.getListInProject(data.pid);
    // 移除公共资源库中的接口
    if (data.excludeShared === true) {
      return interfaces.filter(i => i.projectId === data.pid);
    }
    return interfaces;
  }

  /**
   *  根据接口id获取接口的详细信息（包含最近20条变更历史）
   * @param {number} id 接口id
   * @param pat {object} pat
   * @return {*}
   */
  * getInterfaceDetailById(id, pat) {
    OpenApiOfPATService.checkRead(pat);
    const interfaceService = new InterfaceService(pat.creatorId, this._context);
    // findDetailWithHistoryById 这个方法会校验查看权限
    return yield interfaceService.findDetailWithHistoryById(id);
  }

  /**
   *  根据接口path获取接口的详细信息（包含最近20条变更历史）
   * @param {Object} data
   * @property {number} data.pid 项目id
   * @property {number} data.pid 项目id
   * @param {Object} pat
   * @return {*}
   */
  * getInterfaceDetailByPath(data, pat) {
    OpenApiOfPATService.checkRead(pat);
    const interfaceService = new InterfaceService(pat.creatorId, this._context);
    // 先查项目中的所有接口
    const interfaces = yield interfaceService.getListInProject(data.pid);
    const interfaceMethod = data.method ? data.method.toUpperCase() : '';
    // 这里可能会找到多个，有可能是路径和方法都相同的不同接口，也可能是同个接口的不同版本
    let foundInterfaces = [];
    if (interfaceMethod) {
      foundInterfaces = interfaces.filter(it => {
        return (it.path === data.path) && (it.method === interfaceMethod);
      });
    } else {
      foundInterfaces = interfaces.filter(it => {
        return (it.path === data.path);
      });
    }

    if (foundInterfaces.length) {
      // 按创建时间排序，如果接口有多个版本，就返回最新的版本。看以后有没有需求，先这样处理
      foundInterfaces.sort((interfaceA, interfaceB) => {
        return interfaceB.createTime - interfaceA.createTime;
      });
      // 返回创建时间离现在最近的接口
      return yield interfaceService.findDetailWithHistoryById(foundInterfaces[0].id);
    }
    throw new Forbidden('接口未找到，请检查所有参数是否正确');
  }

  /**
   *  根据项目id获取Rpc接口列表
   * @param data {object} 查询参数
   * @property data.pid {number} 项目id
   * @property data.excludeShared {boolean} 是否移除公共资源库中的接口
   * @param pat {object} 查询参数
   * @return {Array|Object|Interface}
   */
  * getRpcInterfacesByPid(data, pat) {
    OpenApiOfPATService.checkRead(pat);
    const rpcService = new RpcService(pat.creatorId, this._context);
    // getListInProject 会检查权限
    const rpcInterfaces = yield rpcService.getListInProject(data.pid);
    // 移除公共资源库中的接口
    if (data.excludeShared === true) {
      return rpcInterfaces.filter(i => i.projectId === data.pid);
    }
    return rpcInterfaces;
  }

  /**
   *  根据rpc接口id获取接口的详细信息（包含最近20条变更历史）
   * @param {number} id 接口id
   * @param pat {object} pat
   * @return {*}
   */
  * getRpcInterfaceDetailById(id, pat) {
    OpenApiOfPATService.checkRead(pat);
    let rpcService = new RpcService(pat.creatorId, this._context);
    // findDetailWithHistoryById 这个方法会校验查看权限
    return yield rpcService.findDetailWithHistoryById(id);
  }

  /**
   *  根据rpc接口path(指class name和method)获取接口的详细信息（包含最近20条变更历史）
   * @param {Object} data
   * @property {number} data.pid 项目id
   * @property {string} data.className 接口的className
   * @property {string} data.method rpc接口的method，对应表中的path
   * @param {Object} pat
   * @return {*}
   */
  * getRpcInterfaceDetailByMethodName(data, pat) {
    OpenApiOfPATService.checkRead(pat);
    const rpcService = new RpcService(pat.creatorId, this._context);
    // 先查项目中的所有rpc接口
    const rpcInterfaces = yield rpcService.getListInProject(data.pid);
    // 这里可能会找到多个，有可能是类名和方法都相同的不同接口，也可能是同个rpc接口的不同版本
    const foundRpcInterfaces = rpcInterfaces.filter(it => {
      return (it.path === data.methodName) && (it.className === data.className);
    });
    if (foundRpcInterfaces.length) {
      // 按创建时间排序，如果rpc接口有多个版本，就返回最新的版本。看以后有没有需求，先这样处理
      foundRpcInterfaces.sort((rpcInterfaceA, rpcInterfaceB) => {
        return rpcInterfaceB.createTime - rpcInterfaceA.createTime;
      });
      // 返回创建时间离现在最近的rpc接口
      return yield rpcService.findDetailWithHistoryById(foundRpcInterfaces[0].id);
    }
    throw new Forbidden('接口未找到，请检查所有参数是否正确');
  }

  /**
   *  根据接口id和更新时间获取http接口是否更新
   * @param {object} data 查询参数
   * @param {object} pat
   * @return {*}
   */
  * isInterUpdated(data, pat) {
    OpenApiOfPATService.checkRead(pat);
    const resourceHistoryService = new (require('./ResourceHistoryService'))(pat.creatorId, this._context);
    return yield resourceHistoryService.isUpdated({
      type: dbMap.RES_TYP_INTERFACE,
      id: data.id,
      lct: data.lastUpdateTime,
    });
  }

  /**
   *  根据接口id和更新时间获取rpc接口是否更新
   * @param {object} data 查询参数
   * @param {object} pat
   * @return {*}
   */
  * isRpcInterUpdated(data, pat) {
    OpenApiOfPATService.checkRead(pat);
    const resourceHistoryService = new (require('./ResourceHistoryService'))(pat.creatorId, this._context);
    return yield resourceHistoryService.isUpdated({
      type: dbMap.RES_TYP_RPC,
      id: data.id,
      lct: data.lastUpdateTime,
    });
  }

  /**
   *  根据项目id获取该项目的数据模型列表
   * @param data {object} 查询参数
   * @param pat {object} pat
   * @return {Array|Object|Interface}
   */
  * getDatatypesByPid(data, pat) {
    OpenApiOfPATService.checkRead(pat);
    const datatypeService = new DatatypeService(pat.creatorId, this._context);
    return yield datatypeService.getListInProject(data.pid);
  }
}

module.exports = OpenApiOfPATService;
