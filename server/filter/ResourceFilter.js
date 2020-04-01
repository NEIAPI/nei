/**
 * Resource Filter Class
 * Check whether the assoicated progroup is locked
 * Resource including:
 *     templates
 *     interfaces
 *     datatypes
 *     pages
 *     constraints
 *     projects
 *     parameters
 *     iheaders
 *     groups
 *     cliargs
 *     testcases
 */
const log = require('../util/log');
const db = require('../../common').db;
const sqlOpt = {noTransaction: true};
const _ = require('../util/utility');
const pgDAO = new (require('../dao/ProGroupDao'))(sqlOpt);
const projectDAO = new (require('../dao/ProjectDao'))(sqlOpt);
const datatypeDAO = new (require('../dao/DataTypeDao'))(sqlOpt);
const interfaceDAO = new (require('../dao/InterfaceDao'))(sqlOpt);
const rpcDAO = new (require('../dao/RpcDao'))(sqlOpt);
const templateDAO = new (require('../dao/TemplateDao'))(sqlOpt);
const viewDAO = new (require('../dao/ViewDao'))(sqlOpt);
const IllegalRequestError = require('../error/fe/IllegalRequestError');
const NFilter = require('../arch/NFilter');

const hash = {
  'templates': templateDAO,
  'interfaces': interfaceDAO,
  'datatypes': datatypeDAO,
  'pages': viewDAO,
  'constraints': new (require('../dao/ConstraintDao'))(sqlOpt),
  'projects': projectDAO,
  'parameters': new (require('../dao/ParameterDao'))(sqlOpt),
  'iheaders': new (require('../dao/InterfaceHeaderDao'))(sqlOpt),
  'groups': new (require('../dao/BisGroupDao'))(sqlOpt),
  'cliargs': new (require('../dao/CliArgDao'))(sqlOpt),
  'testcases': new (require('../dao/TestcaseDao'))(sqlOpt)
};

const paramHash = {
  [db.PAM_TYP_QUERY]: viewDAO,
  [db.PAM_TYP_VMODEL]: templateDAO,
  [db.PAM_TYP_INPUT]: interfaceDAO,
  [db.PAM_TYP_OUTPUT]: interfaceDAO,
  [db.PAM_TYP_ATTRIBUTE]: datatypeDAO,
  [db.PAM_TYP_RPC_INPUT]: rpcDAO,
  [db.PAM_TYP_RPC_OUTPUT]: rpcDAO,
};

function* findPgids(serviceName, parentType, parentId) {
  let dao = serviceName === 'parameters' ? paramHash[parentType] : interfaceDAO;
  if (dao) {
    let rec = yield dao.find(parentId);
    if (rec) {
      return [rec.progroupId];
    }
  }
  return [];
}

class ResourceFilter extends NFilter {
  * doFilter() {
    log.debug(
      '[%s] do resource filter',
      this.constructor.name
    );

    if (this._rmethod === 'GET') {
      return yield super.chain();
    }

    let body = this._body,
      query = this._query,
      pgids;

    let url = this._context.url;
    let paths = url.split('/');
    let serviceName = paths[2];
    let dao = hash[serviceName];
    if (!dao) {
      return yield super.chain();
    }

    if (this._context._id) {
      let res = yield dao.find(this._context._id);
      if (res) {
        pgids = [res.progroupId];
      }
    } else {
      if (this._rmethod === 'DELETE') {
        if (query.hasOwnProperty('ids')) {
          _.translateParams(query, ['ids']);
          let rec = yield dao.findBatch(query.ids);
          pgids = rec.map(it => it.progroupId);
        } else if (/^(parameters|iheaders)$/.test(serviceName)) {
          let {parentId, parentType} = query;
          pgids = yield findPgids(serviceName, parentType, parentId);
        }
      } else {
        if (['move', 'clone'].some(Object.prototype.hasOwnProperty, query) &&
          ['templates', 'interfaces', 'pages', 'datatypes', 'constraints']) {
          pgids = body.gid;
        } else if (body.hasOwnProperty('projectId') && /\d+/.test(body.projectId)) {
          // resource creation
          let project = yield projectDAO.find(body.projectId);
          if (project) {
            pgids = [project.progroupId];
          }
        } else if (serviceName === 'projects' && body.hasOwnProperty('progroupId')) {
          // project creation
          pgids = [body.progroupId];
        } else if (/^(parameters|iheaders)$/.test(serviceName)) {
          // parameter and headers creation
          let data = serviceName === 'parameters' ? (body.items && body.items[0] || body) : body;
          let {parentId, parentType} = data;
          pgids = yield findPgids(serviceName, parentType, parentId);
        }
      }
    }

    let resources = [];
    if (pgids && pgids.length) {
      resources = yield pgDAO.findBatch(pgids);
    }

    if (resources.some(it => {
        return it.isLock;
      })) {
      throw new IllegalRequestError(`该项目组已被锁定，不能操作`);
    }
    return yield super.chain();
  }
}

module.exports = ResourceFilter;
