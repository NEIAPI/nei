const log = require('../util/log');
const dt = require('./config/const.json');
const db = require('../../common/config/db.json');
const ResourceDao = require('./ResourceDao');

class AuditDao extends ResourceDao {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/Audit');
  }

  /**
   * 返回一个常数，因为audit没有增删改查，权限由service判断即可
   *
   * @param  {Number} id  - spec id
   * @param  {Number} uid - user id
   * @return {Object} role info between user and spec, e.g. {role:-1, specId:0, otherRoles: []}
   */
  * getRoleOfUser(id, uid) {
    return 5;
  }
}


AuditDao['__history'] = {
  approveText: '通过了接口审核 %s',
  rejectText: '拒绝了接口审核 %s，理由是：%s'
};

module.exports = AuditDao;
