class InterfaceHeaderDao extends require('./AttributeDao') {
  constructor(type, sqlOpt) {
    super(type, sqlOpt);
    this._Model = require('../model/db/InterfaceHeader');
    this._expModels = [
      {
        key: 'overwrite',
        Model: require('../model/db/InterfaceHeaderOverwrite'),
        Dao: new (require('../dao/InterfaceHeaderOverwriteDao'))(sqlOpt)
      },
      {
        key: 'imp0rt',
        Model: require('../model/db/InterfaceHeaderCombination'),
        Dao: new (require('../dao/InterfaceHeaderCombinationDao'))(sqlOpt)
      }
    ];
  }
}

module.exports = InterfaceHeaderDao;
