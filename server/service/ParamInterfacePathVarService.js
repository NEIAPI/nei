const ParamInterfaceService = require('./ParamInterfaceService');
const IllegalRequestError = require('../error/fe/IllegalRequestError');

/**
 * Interface Parameter Service Class
 */

class ParamInterfacePathVarService extends ParamInterfaceService {
  constructor(uid, context) {
    super(uid, context, '../dao/ParamInterfacePathVarDao');
  }

  /**
   * update pathParams
   * @param {model/db/Parameter} model - parameter
   * @return {model/db/Parameter} parameter
   */
  * update(model) {
    const allowKeys = ['id', 'parentId', 'parentType', 'defaultValue', 'description', 'type', 'typeName'];
    for (let key in model) {
      if (!allowKeys.includes(key)) throw new IllegalRequestError('contains illegal fields');
    }
    return yield super.update(model);
  }

  /**
   * build pathParams from urlParams
   * @param {string} parentId
   * @param {string[]} urlParams - interface path urlParams
   */
  * build(parentId, urlParams) {
    const nPathParams = [];
    let pathParams = yield this.getListBatch([parentId]);
    pathParams = pathParams[parentId] || [];
    // name优先 index其次
    const pathParamsMap = {};
    for (let urlParam of urlParams) {
      pathParamsMap[urlParam] = pathParams.find(pathParam => pathParam.name === urlParam);
    }
    for (let i = 0; i < urlParams.length; i++) {
      const urlParam = urlParams[i];
      let pathParam = pathParamsMap[urlParam];
      if (!pathParam) pathParam = (pathParams[i] && !pathParamsMap[pathParams[i].name]) ? pathParams[i] : {description: ''};
      nPathParams.push({
        type: 10001,
        name: urlParam,
        parentType: 5,
        description: pathParam.description
      });
    }
    yield this.remove({parentId}, {clearAll: true});
    return yield this.create({parentId, params: nPathParams}, {sendMsg: false});
  }
}

module.exports = ParamInterfacePathVarService;
