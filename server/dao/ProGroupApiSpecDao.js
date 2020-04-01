const dbMap = require('../../common').db;
const NDao = require('./NDao');

class ProGroupApiSpecDao extends NDao {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/ProgroupApiSpec');
  }
}

ProGroupApiSpecDao['__history'] = {
  updateText: '更新项目组 %s 的 %s 接口规范的 %s 为 %s，旧值是 %s',
  resType: dbMap.RES_TYP_PROGROUP,
  apiTypeNames: {
    [dbMap.INTERFACE_TYP_HTTP]: 'HTTP',
    [dbMap.INTERFACE_TYP_RPC]: 'RPC',
  },
  canUpdateProps: [
    {
      name: 'path',
      description: '请求地址规范'
    },
    {
      name: 'pathDescription',
      description: '请求地址规范描述'
    },
    {
      name: 'param',
      description: '参数规范'
    },
    {
      name: 'paramDescription',
      description: '参数规范描述'
    },
    {
      name: 'method',
      description: '请求方式规范'
    },
    {
      name: 'methodDescription',
      description: '请求方式规范描述'
    },
    {
      name: 'tag',
      description: '标签规范'
    },
    {
      name: 'tagDescription',
      description: '标签规范描述'
    },
    {
      name: 'resSchema',
      description: '响应结果规范Schema'
    },
    {
      name: 'resSchemaDescription',
      description: '响应结果规范Schema描述'
    },
    {
      name: 'interfaceSchema',
      description: '接口出入参规范Schema'
    },
    {
      name: 'interfaceSchemaDescription',
      description: '接口出入参规范Schema描述'
    }
  ],
};

module.exports = ProGroupApiSpecDao;
