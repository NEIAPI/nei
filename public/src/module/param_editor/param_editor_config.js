/**
 * 参数编辑器组件
 */
NEJ.define([
  'pro/common/util'
], function (util, p) {

  // 默认参数配置选项
  p.options = {
    // 类别
    formats: [
      {format: util.db.MDL_FMT_HASH, name: '哈希'},
      {format: util.db.MDL_FMT_ENUM, name: '枚举'},
      {format: util.db.MDL_FMT_ARRAY, name: '数组'},
      {format: util.db.MDL_FMT_STRING, name: '字符'},
      {format: util.db.MDL_FMT_NUMBER, name: '数值'},
      {format: util.db.MDL_FMT_BOOLEAN, name: '布尔'},
      {format: util.db.MDL_FMT_HASHMAP, name: '集合'},
      {format: util.db.MDL_FMT_FILE, name: '文件'}
    ],
    // 预置参数
    params: [],
    // 选中的类别
    format: util.db.MDL_FMT_HASH,
    // 类别是否可以修改
    formatChangeable: true,
    // 表头
    headers: {},
    // 参数发生变化
    onChange: function () {

    }
  };

  // 参数所属资源类型
  p.options.paramTypes = {
    datatype: 4,
    interface: 3
  };

  // 导入类别
  p.importTypes = {
    DATATYPE: 0,
    JSON: 1,
    INTERFACE: 2,
    JAVABEAN: 3
  };

  // 两个自定义类型: object 和 array，后端需要一个合法的整数id
  p.customDatatypes = {
    OBJECT_ID: 8999,
    ARRAY_ID: 9000
  };

  // 编辑框错误信息
  p.editorErrorMap = {
    DUMPLICATE: {
      type: 1,
      msg: '存在相同名称的属性'
    },
    NOT_IN_WORD_STOCK: {
      type: 2,
      msg: '参数名未在参数字典内定义'
    }
  };

  // 哈希表头
  // skipInSelectDetail: true 表示在 select 中的详情中不显示
  p.options.headers[util.db.MDL_FMT_HASH] = [
    {name: '名称', key: 'name', clazz: 'x-name'},
    {name: '类型', key: 'typeName', select: true, clazz: 'x-type'},
    {name: '描述', key: 'description', clazz: 'x-desc'},
    {name: '必需', key: 'required', select: true, clazz: 'x-req', skipInSelectDetail: true},
    {name: '默认值', key: 'defaultValue', clazz: 'x-dv', skipInSelectDetail: true},
    {name: '生成规则', key: 'genExpression', clazz: 'x-gexp', rule: true, skipInSelectDetail: true}
  ];

  // 枚举表头
  p.options.headers[util.db.MDL_FMT_ENUM] = [
    {name: '值', key: 'defaultValue', clazz: 'x-dv'},
    {name: '类型', key: 'typeName', select: true, clazz: 'x-type'},
    {name: '键（可选）', key: 'name', clazz: 'x-name'},
    {name: '描述', key: 'description', clazz: 'x-desc'}
  ];

  // 数组表头
  p.options.headers[util.db.MDL_FMT_ARRAY] = [
    {name: '数组元素类型', key: 'typeName', select: true, clazz: 'x-type'},
    {name: '描述', key: 'description', clazz: 'x-desc'},
    {name: '默认值', key: 'defaultValue', clazz: 'x-dv'},
    {name: '生成规则', key: 'genExpression', clazz: 'x-gexp', rule: true, skipInSelectDetail: true}
  ];

  // 字符、数值、布尔表头
  p.options.headers[util.db.MDL_FMT_STRING]
    = p.options.headers[util.db.MDL_FMT_NUMBER]
    = p.options.headers[util.db.MDL_FMT_BOOLEAN] = [
    {name: '默认值', key: 'defaultValue', clazz: 'x-dv'},
    {name: '描述', key: 'description', clazz: 'x-desc'},
    {name: '生成规则', key: 'genExpression', clazz: 'x-gexp', rule: true, skipInSelectDetail: true}
  ];

  // 文件表头
  p.options.headers[util.db.MDL_FMT_FILE] = [
    {name: '描述', key: 'description', clazz: 'x-desc'}
  ];

  // 集合表头
  p.options.headers[util.db.MDL_FMT_HASHMAP] = [
    {name: '', key: 'name', clazz: 'x-hm'},
    {name: '类型', key: 'typeName', select: true, clazz: 'x-type'},
    {name: '描述', key: 'description', clazz: 'x-desc'},
    {name: '默认值', key: 'defaultValue', clazz: 'x-dv'},
    {name: '生成规则', key: 'genExpression', clazz: 'x-gexp', rule: true, skipInSelectDetail: true}
  ];

  // HTTP 接口请求头
  p.options.headers.iheader = [
    {name: '名称', key: 'name', clazz: 'x-name', select: true},
    {name: '值', key: 'defaultValue', clazz: 'x-dv', select: true},
    {name: '描述', key: 'description', clazz: 'x-desc'},
  ];
});
