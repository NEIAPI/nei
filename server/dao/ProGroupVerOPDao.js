const dbMap = require('../../common').db;

class ProGroupVerOPDao extends require('./NDao') {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/ProgroupVerificationOp');
  }

  /**
   * find progroup application operations
   * @param {Array Number} aids - application ids
   * @return {Array} project order list
   */
  * findOperations(aids) {
    let ops = yield this.search({
      field: {
        'id': {
          func: 'MAX',
          alias: 'id'
        }
      },
      conds: {
        'verification_id': aids
      },
      group: 'verification_id'
    });
    return yield this.search({
      field: {
        'message': {
          alias: 'verifyMessage'
        },
        'result': {
          alias: 'verifyResult'
        }
      },
      sfields: ['verification_id', 'role'],
      conds: {
        id: (ops || []).map(it => it.id)
      },
      joins: this._getUserJoins()
    });
  }
}

ProGroupVerOPDao['__history'] = {
  rejectText: '拒绝 %s 加入项目组 %s',
  passText: '批准 %s 以 %s 身份加入项目组 %s',
  resType: dbMap.RES_TYP_PROGROUP,
};
module.exports = ProGroupVerOPDao;
