class ParameterDao extends require('./AttributeDao') {
  constructor(patentType, sqlOpt) {
    super(patentType, sqlOpt);
    this._Model = require('../model/db/Parameter');
    this._expModels = [
      {
        key: 'overwrite',
        Model: require('../model/db/ParameterOverwrite'),
        Dao: new (require('../dao/ParameterOverwriteDao'))(sqlOpt)
      },
      {
        key: 'imp0rt',
        Model: require('../model/db/ParameterCombination'),
        Dao: new (require('../dao/ParameterCombinationDao'))(sqlOpt)
      }
    ];
  }

  /** 通过 type 获取 parameter 参数
   */
  * getByType(type) {
    let result = yield this.search({
      conds: {
        type
      },
    });
    return result;
  }

  /**
   * 获取参数的频次
   * @param {*} conds
   * @returns
   * @memberof ParameterDao
   */
  * getParamTimes(conds) {
    let result = yield this.search({
      conds,
      sfields: ['name'],
      field: {
        id: {
          func: 'count',
          alias: 'times'
        }
      },
      group: ['name'],
    });
    return result;
  }
}

module.exports = ParameterDao;
