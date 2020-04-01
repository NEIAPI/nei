/**
 * Interface Parameter Service Class
 */
const TestcaseService = require('./TestcaseService');

class ParamInterfaceReqService extends require('./ParamInterfaceService') {
  constructor(uid, context) {
    super(uid, context, '../dao/ParamInterfaceReqDao');
  }

  /**
   * 修改响应参数后，需要更新测试用例的状态
   *
   * @param {Number} parentId - 接口id
   * @param {Object} newParam - 更新后的参数数据
   * @param {Object} oldParam - 更新前的参数数据
   */
  * _afterUpdate({parentId, newParam, oldParam}) {
    const interfaceId = parentId;
    const isNameUpdated = newParam.name !== oldParam.name;
    const isTypeUpdated = newParam.type !== oldParam.type || newParam.isArray !== oldParam.isArray;
    const isIgnoredUpdated = newParam.ignored !== oldParam.ignored;
    const isGenExpression = newParam.genExpression !== oldParam.genExpression;
    const isRequired = newParam.required !== oldParam.required;
    // 如果名称、类型、字段的显示或隐藏、是否必需、生成规则，任一有改动，就更新接口相关测试用例的状态
    if (isNameUpdated || isTypeUpdated || isIgnoredUpdated || isRequired || isGenExpression) {
      const testcaseService = new TestcaseService(this._uid, this._context);
      yield testcaseService.disableByInterfaceId(interfaceId);
    }
  }
}

module.exports = ParamInterfaceReqService;
