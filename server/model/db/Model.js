/**
 *  Base Model Class
 */
const util = require('util');
const utility = require('../../util/utility');

// common fields
const FIELDS = {};
// type transform
const TRANSFORM = {
  /**
   * @return {number}
   */
  'Number': function (v) {
    if ((typeof v) === 'boolean') {
      return v ? 1 : 0;
    }
    v = parseInt(v, 10);
    return isNaN(v) ? null : v;
  },
  /**
   * @return {string}
   */
  'String': function (v) {
    return v === null ? '' : v;
  },
  /**
   * @return {number}
   */
  'Date': function (v) {
    return Date.parse(v) || 0;
  }
};
const NObject = require('../../NObject');

/**
 * Base Model Class
 */
class Model extends NObject {
  /**
   * config Model fields
   *
   * @param  {String} table  - table name
   * @param  {Object} fields - table fields config
   * @param  {Array}  primary - primary fields
   * @return {Void}
   */
  static props(table, fields, primary) {
    // save table name
    this._table = table;
    // save table fields
    this._fields = Object.assign(
      {}, FIELDS, fields
    );
    // save primary fields
    this._primary = primary || ['id'];
  }

  /**
   * check is primary field
   *
   * @param  {String} field - field name
   * @return {Boolean} is primary field
   */
  static isPrimary(field) {
    return this._primary.includes(field);
  }

  /**
   * get field config with name
   * @param  {String} name - field name
   * @return {Object} field config object
   */
  static getField(name) {
    if (name == null) {
      return this._fields;
    }
    return this._fields[name];
  }

  /**
   * get table name of bind model
   * @return {String} table name
   */
  static getTableName() {
    return this._table;
  }

  /**
   * get fields sql for table
   * @param  {Object} config  - config object
   * @param  {Boolean} config.table - use table name as prefix
   * @param  {Boolean} config.alias - use alias for field name
   * @param  {Object}  config.funcs - field function config
   * @return {String} sql fields
   */
  static getFieldSQL(config = {}, fields) {
    let ret = [],
      prefix = '',
      list = this.getField(),
      table = this.getTableName(),
      funcs = config.funcs || {};
    // generate fields list
    if (!fields || !fields.length) {
      fields = Object.keys(list);
    }
    fields.forEach(function (key) {
      // check use table name prefix
      if (config.table) {
        prefix = util.format(
          '`%s`.', table
        );
      }
      let suffix = '',
        name = utility.toUnderline(key);
      if (config.alias) {
        suffix = util.format(
          ' AS `%s.%s`', table, name
        );
      }
      // check function
      let wrap = '%s',
        func = (funcs[key] || '');
      name = util.format('`%s`', name);
      if (func) {
        let alias = '';
        if (utility.isObject(func)) {
          if (config.alias) {
            alias = ` AS \`${table}.${func.alias}\``;
          } else {
            alias = ` AS \`${func.alias}\``;
          }
          suffix = '';
          func = func.func;
        }
        func = (func || '').toUpperCase();
        if (func === 'DISTINCT') {
          wrap = `${func} %s${alias}`;
        } else {
          wrap = `${func}(%s)${alias}`;
        }
        if (!Object.keys(list).includes(key)) {
          prefix = '';
          name = utility.toUnderline(key);
        }
      }
      let str = util.format(
        '%s%s%s',
        prefix, name, suffix
      );
      ret.push(util.format(wrap, str));
    });
    return ret.join(', ');
  }

  /**
   * parse sql conditions
   *
   * @private
   * @param  {Object} conds - conditions object
   * @param  {Object} options - config object
   * @param  {String} options.prefix - table prefix
   * @param  {Array}  options.args   - arguments result list
   * @param  {Array}  options.conds  - conditions result list
   * @return {Void}
   */
  static _parseCondition(conds, options) {
    let args = options.args || [],
      carr = options.conds || [],
      prefix = options.prefix || '';
    if (!Array.isArray(conds)) {
      conds = [conds]; //OR support
    }
    let holder = [];
    for (let cond of conds) {
      let temArr = [];
      Object.keys(cond).forEach(function (fd) {
        // op:'=', value:'xxxxx'
        let it = cond[fd], val;
        if (!it.op) {
          it = {value: it, op: '='};
          if (Array.isArray(it.value)) {
            if (it.value.length > 1) {
              it.op = 'IN';
            } else {
              it.value = it.value[0];
            }
          }
        }
        if (Array.isArray(it.value)) {
          args.push(...(it.value));
          val = '(' + new Array(it.value.length).join('?,') + '?)';

          if (['!=', '<>'].includes(it.op)) {
            it.op = 'NOT IN';
          }
        } else if (it.subquery) { // 有可能是子查询, 此时value是一个已经format的sql
          val = it.value;
        } else {
          val = '?';
          args.push(it.value);
        }
        // `table1`.`fields` in (?,?,?)
        let cdt = util.format(
          '%s`%s` %s %s',
          prefix, utility.toUnderline(fd), it.op, val
        );
        temArr.push(cdt);
      });
      if (temArr.length) {
        holder.push(temArr.join(' AND ')); // each condition
      }
    }
    if (holder.length) {
      let hasOrCond = holder.length > 1,
        template = '%s';
      if (hasOrCond) {
        template = '(%s)'; // the whole OR clause should be wrapped with ()
        holder = holder.map(it => `(${it})`); // each OR conditioin should be wrapped with ()
      }
      carr.push(util.format(
        template,
        holder.join(' OR ')
      ));
    }
  }

  /**
   * parse sql join conditions
   *
   * @private
   * @param  {Array joinObj} joins - join config list
   * @param  {String} joinObj.table - table name to be joined
   * @param  {String} joinObj.alias - table alias
   * @param  {Boolean} joinObj.propogate - whether to spread the properties into main fields
   * @param  {Object} options - config object
   * @param  {Array}  options.args   - arguments result list
   * @param  {Array}  options.conds  - conditions result list
   * @param  {Array}  options.jconds  - join conditions result list
   * @param  {Array}  options.fields - fields result list
   * @param  {Array}  options.tables - tables result list
   * @return {Void}
   */
  static _parseConditionJoins(joins, options) {
    let tarr = options.tables || [],
      farr = options.fields || [],
      carr = options.conds || [],
      jarr = options.jconds || [],
      args = options.args || [],
      groupOpt = options.groupOpt || {};
    joins.forEach((it) => {
      // table:'', fkmap:{f1:'f2'}, field:['f1','f2','f3'], conds:{}, type: 'inner'
      let tab = it.table,
        propagate = it.propagate,
        alias = it.alias,
        prefix;
      // check alias
      if (!alias && !propagate) {
        prefix = '`' + tab + '`';
        tarr.push(prefix);
      } else {
        alias = alias || it.table;
        if (propagate) {
          alias = '__' + alias;
        }
        prefix = '`' + alias + '`';
        tarr.push(util.format(
          '`%s` AS `%s`', tab, alias
        ));
      }
      alias = alias || tab;
      // check export fields
      if (it.field) {
        it.field.forEach(function (fld) {
          let cdt = util.format(
            '`%s`.`%s` AS `%s.%s`',
            alias, fld, alias, fld
          );
          farr.push(cdt);
        });
      }
      // check foreign key map
      if (it.fkmap) {
        let perJoin = [];
        let sConds = [];
        Object.keys(it.fkmap).forEach(function (fld) {
          if (it.fkmap[fld].type == 'self') {
            sConds.push({[fld]: it.fkmap[fld]});
          } else {
            let cdt = util.format(
              '`%s`.`%s`=%s.`%s`',
              alias, utility.toUnderline(fld), tarr[0], utility.toUnderline(it.fkmap[fld])
            );
            perJoin.push(cdt);
          }
        });
        if (sConds.length) {
          let sargs = [];
          let scarr = [];
          this._parseCondition(
            sConds, {
              args: sargs,
              conds: scarr,
              prefix: prefix + '.'
            }
          );
          perJoin.push(util.format(scarr.join(' AND ').replace(/\?/g, '%s'), ...sargs));
        }

        if (it.type) {
          perJoin.type = it.type;
        }
        jarr.push(perJoin);
      }
      // check join conditions
      if (it.conds) {
        this._parseCondition(
          it.conds, {
            args: args,
            conds: carr,
            prefix: prefix + '.'
          }
        );
      }
      if (it.group && !groupOpt.group) {
        groupOpt.group = it.group;
        groupOpt.table = alias;
      }
    });
  }

  /**
   * parse order condition
   *
   * @private
   * @param  {Object}  order
   * @param  {String}  order.field - order field name
   * @param  {Boolean} order.desc -  sort type
   * @param  {String}  table - table name
   * @return {String}  order statement
   */
  static _parseConditionOrder(order, table) {
    if (Array.isArray(order)) {
      let ret;
      order.some((it) => {
        ret = this._parseConditionOrder(
          it.order, it.alias || it.table
        );
        return !!ret;
      });
      return ret;
    }
    if (order) {
      let tb = '';
      if (table) {
        tb = table + '`.`';
      }
      return util.format(
        'ORDER BY `%s%s` %s', tb,
        utility.toUnderline(order.field),
        !order.desc ? 'ASC' : 'DESC'
      );
    }
  }

  /**
   * parse group by condition
   *
   * @private
   * @param  {Object}  order
   * @param  {String}  order.field - order field name
   * @param  {String}  table - table name
   * @return {String}  order statement
   */
  static _parseGroup(group, table) {
    if (!group) {
      return '';
    }
    let tb = '';
    if (table) {
      tb = `\`${table}\`.`;
    }
    if (!Array.isArray(group)) {
      group = [group];
    }

    group = group.map((gp) => `${tb}\`${gp}\``);
    return util.format(
      'GROUP BY %s',
      group.join(', ')
    );
  }

  /**
   * parse page condition
   *
   * @private
   * @param  {Object} pages - page information
   * @param  {Number} pages.offset - page offset
   * @param  {Number} pages.limit  - page limit
   * @return {String} page statement
   */
  static _parseConditionLimit(pages) {
    pages = pages || {};
    let ret = [];
    ['limit', 'offset'].forEach(function (it) {
      let val = parseInt(pages[it]);
      if (!isNaN(val)) {
        ret.push(it.toUpperCase(), val);
      }
    });
    return ret.join(' ');
  }

  /**
   * get join sql
   *
   * @private
   * @param  {Object} tables - tables array
   * @param  {Number} jarr - join array
   * @return {String}
   */
  static _getJoinsSQL(tables, jarr) {
    if (tables.length === 1) {
      return tables[0];
    }
    let result = [];
    let joinTbs = Array.prototype.slice.call(tables, 1);
    joinTbs.forEach((tb) => {
      let joinCond = jarr.shift();
      if (joinCond) {
        result.push(util.format(
          '%sJOIN %s ON %s',
          joinCond.type ? `${joinCond.type} ` : '',
          tb,
          joinCond.join(' AND ')));
      }
    });
    return tables[0] + ' ' + result.join(' ');
  }

  /**
   * generate select sql statement with condition
   *
   * ```sql
   * SELECT
   *      `user`.`id` AS `user.id`,`progroup_user`.`role` AS `progroup_user.role`
   * FROM
   *      `user`,`progroup_user`
   * WHERE
   *      `user`.`id`=`progroup_user`.`user_id` and `progroup_id`=?
   * ```
   *
   * @private
   * @param  {Object} options - conditions config
   * @param  {Array} options.sfields - select fields, e.g. [field1, field2]
   * @param  {Object} options.field - table field config, e.g.  {field1:'DISTINCT', '*': {alias: 'abc', func:'count'}
   * @param  {Array|String} options.group - group by config, e.g. ['abc', 'def'] Or 'abc'
   * @param  {Object} options.order - order field and sort type, e.g. {field:'create_time',desc:!0}
   * @param  {Object} options.pages - recorder page information, e.g. {offset:0,limit:10}
   * @param  {Object} options.conds - conditions for table, e.g. {field1:{op:'!=',value:id}}
   * @param  {Array}  options.joins - table join config, e.g. [{table:'xxxx',alias:'xxx',fkmap:{f1:'f2'},conds:{f1:{op:'>',value:id}}, field: [field1, field2]}]
   *
   * @return {Object} conditions result, e.g. {sql:'',args:[]}
   */
  static toSearchSQL(options) {
    let fields = [],
      opt = {
        table: !!options && !!options.joins,
        alias: !!options && !!options.joins
      };
    // check field config
    if (options && options.field) {
      opt.funcs = options.field;
      fields = Object.keys(options.field);
    }
    if (options.sfields) {
      (options.sfields || []).forEach(item => {
        if (!fields.includes(item)) {
          fields.push(item);
        }
      });
    }
    let farr = [this.getFieldSQL(opt, fields)],     // fields list
      tarr = ['`' + this.getTableName() + '`'],   // table join list
      carr = [],                                  // condition list
      args = [],                                  // arguments list
      jarr = [];                                  // join list
    // check conditions for own table
    if (options && options.conds) {
      let prefix = '';
      if (opt.table) {
        prefix = tarr[0] + '.';
      }
      this._parseCondition(
        options.conds, {
          args,
          conds: carr,
          prefix
        }
      );
    }
    let groupOpt = {
      group: options.group,
      table: opt.table ? this.getTableName() : '',
    };
    // check conditions for join table
    if (options && options.joins) {
      this._parseConditionJoins(
        options.joins, {
          tables: tarr,
          fields: farr,
          conds: carr,
          args: args,
          jconds: jarr,
          groupOpt
        }
      );
    }
    // check order
    let order = this._parseConditionOrder(
      options.order, opt.table ? this.getTableName() : ''
    );
    if (!order) {
      order = this._parseConditionOrder(options.joins);
    }

    let sql = options &&
    ((Object.keys(options.conds || {}).length > 0) || (options.joins || []).length > 0) ?
      util.format(
        'SELECT %s FROM %s WHERE %s %s %s %s',
        farr.join(','),
        this._getJoinsSQL(tarr, jarr),
        carr.join(' AND '),
        this._parseGroup(groupOpt.group, groupOpt.table),
        order || '',
        this._parseConditionLimit(options.pages)
      ) :
      util.format(
        'SELECT %s FROM %s %s %s %s',
        farr.join(','),
        tarr.join(','),
        this._parseGroup(groupOpt.group, groupOpt.table),
        order || '',
        this._parseConditionLimit(options.pages)
      );
    // generate result
    return {
      args: args,
      sql: sql.trim()
    };
  }

  /**
   * generate delete sql statement
   *
   * ```sql
   * DELETE FROM `tb` WHERE id=?;
   * ```
   *
   * @param  {Object} conds - filter conditions
   * @return {Object} sql result, e.g. {sql:'',args:[]}
   */
  static toDeleteSQL(conds) {
    let arr = [],
      ret = {args: []};
    if (conds) {
      this._parseCondition(conds, {
        conds: arr,
        args: ret.args
      });
    }
    ret.sql = util.format(
      'DELETE FROM `%s` WHERE %s;',
      this.getTableName(),
      arr.join(' AND ')
    );
    return ret;
  }

  /**
   * constructor of Model
   * @param {Object} data - model data
   */
  constructor(data) {
    super(data);
    this.ext = {}; // holder for non-self attributes
    this._set(data);
  }

  /**
   * set model data.
   * @private
   * @param  {Object} data - model data
   * @return {Void}
   */
  _set(data) {
    let table = this.constructor.getTableName();
    Object.keys(data).forEach((key) => {
      let fed = key,
        tab = table,
        val = data[key],
        arr = (key || '').split('.');
      // table.field -> field
      if (arr.length > 1) {
        [tab, fed] = arr;
      }
      // check field in join table
      fed = utility.toCamel(fed);
      if (tab !== table) {
        let ret = this.ext[tab] || {};
        ret[fed] = val;
        this.ext[tab] = ret;
        return;
      }
      // property only in table fields, or rename fields
      let it = this.constructor.getField(fed);
      if (it && it.type) {
        let func = TRANSFORM[it.type];
        if (func) {
          val = func(val);
        }
      }
      this[fed] = val;
    });
  }

  /**
   * prepare dump field information
   * @protected
   * @return {Objct} field information, e.g. {fields:[],args:[]}
   */
  _prepareField() {
    let ret = {fields: [], args: []};
    Object.keys(this).forEach((field) => {
      let it = this.constructor.getField(field);
      // ignore field if
      // - illegal field
      // - auto increase field
      // - timestamp field
      if (!it || it.primary || field === 'createTime') {
        return;
      }
      // check value
      let value = this[field],
        func = TRANSFORM[it.type];
      if (func) {
        value = func(value);
      }
      // insert not-null field and value
      if (value != null) {
        let farr = ret.fields;
        let args = ret.args;
        field = utility.toUnderline(field);
        farr.push(util.format('`%s`', field));
        args.push(value);
      }
    });
    return ret;
  }

  /**
   * generate select sql statement with condition
   *
   * ```sql
   * SELECT
   *      `user`.`id` AS `user.id`,`progroup_user`.`role` AS `progroup_user.role`
   * FROM
   *      `user`,`progroup_user`
   * WHERE
   *      `user`.`id`=`progroup_user`.`user_id` and `progroup_id`=?
   * ```
   *
   * @param  {Array} conds - conditions for model table
   * @param  {Array} joins - join config object list
   * @param  {Object} join - join config object
   * @param  {String} join.table - join table name
   * @param  {Object} join.fkmap - foreign key map
   * @param  {Array}  join.field - fields want to export
   * @param  {Object} join.conds - join field map, e.g {'id':'user_id'}
   * @return {Object} sql result, e.g. {sql:'',args:[]}
   */
  toSearchSQL(...args) {
    return this.constructor.toSearchSQL(...args);
  }

  /**
   * generate delete sql statement
   *
   * ```sql
   * DELETE FROM `tb` WHERE id=?;
   * ```
   *
   * @return {Object} sql result, e.g. {sql:'',args:[]}
   */
  toDeleteSQL(...args) {
    return this.constructor.toDeleteSQL(...args);
  }

  /**
   * generate insert sql statement
   *
   * ```sql
   * INSERT INTO `tb` (`f1`, `f2`, `f3`) VALUES (?, ?, ?);
   * ```
   *
   * @return {Object} sql result, e.g. {sql:'',args:[]}
   */
  toInsertSQL() {
    let ret = this._prepareField();
    return {
      args: ret.args,
      sql: util.format(
        'INSERT INTO `%s` (%s) VALUES (%s);',
        this.constructor.getTableName(),
        ret.fields.join(', '),
        new Array(ret.args.length).join('?, ') + '?'
      )
    };
  }

  /**
   * generate update sql statement
   *
   * ```sql
   * UPDATE `tb` SET `f1`=?, `f2`=? WHERE id=?;
   * ```
   *
   * @return {Object} sql result, e.g. {sql:'',args:[]}
   */
  toUpdateSQL(conds) {
    // parse fields
    let ret = this._prepareField();
    if (!conds) {
      conds = {id: this.id};
    }
    // parse conditions
    let arr = [];
    this.constructor._parseCondition(
      conds, {
        conds: arr,
        args: ret.args
      }
    );
    return {
      args: ret.args,
      sql: util.format(
        'UPDATE `%s` SET %s WHERE %s;',
        this.constructor.getTableName(),
        ret.fields.join('=?, ') + '=?',
        arr.join(' AND ')
      )
    };
  }

  /**
   * convert to view model
   * @return {ViewModel} - view model instance
   */
  toViewModel() {
    return new (this.getViewModel())(this);
  }

  /**
   * serialize to json string
   *
   * @return {String} json string
   */
  toNObjectString() {
    let fields = this.constructor.getField();
    return JSON.stringify(
      this, Object.keys(fields)
    );
  }
}

module.exports = Model;
