NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'base/event',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/cache/pg_cache',
  'pro/cache/pg_applying_cache',
  'pro/stripedlist/stripedlist',
  'pro/modal/modal_agree',
  'pro/modal/modal_reject',
  'pro/select2/select2',
  'pro/notify/notify',
  'json!3rd/fb-modules/config/db.json'
], function (_k, _e, _u, _v, _t, _l, _m, _pgCache, _pgApplyCache, _sl, _pal, _prl, _s2, _notify, _dbConst, _p, _pro) {
  /**
   * 项目组权限管理模块
   * @class   {wd.m._$$ModuleProGroupDetailPR}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleProGroupDetailPR = _k._$klass();
  _pro = _p._$$ModuleProGroupDetailPR._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    var _this = this;
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-pg-d-pr')
    );
    this.__loading = _e._$getByClassName(document, 'u-loading')[0];
    this.__roleList = [
      {name: '观察者', id: _dbConst.PRG_ROL_GUEST},
      {name: '管理员', id: _dbConst.PRG_ROL_ADMIN},
      {name: '开发者', id: _dbConst.PRG_ROL_DEVELOPER},
      {name: '测试者', id: _dbConst.PRG_ROL_TESTER},
      {name: '审核者', id: _dbConst.PRG_ROL_AUDITOR},
    ];
    this.__pgCacheOptions = {
      onitemload: function () {
        _this.progroup = _this.__pgCache._$getItemInCache(_this.pgid);
        if (_this.progroup.verification == _dbConst.PRG_VRF_AUTH) {
          _e._$addClassName(_this.__typeChoose[0], 'j-selected');
          if (!!_e._$hasClassName(_this.__typeChoose[1], 'j-selected')) {
            _e._$delClassName(_this.__typeChoose[1], 'j-selected');
          }
        } else {
          _e._$addClassName(_this.__typeChoose[1], 'j-selected');
          if (!!_e._$hasClassName(_this.__typeChoose[0], 'j-selected')) {
            _e._$delClassName(_this.__typeChoose[0], 'j-selected');
          }
          var selectedRole = _this.__roleList.filter(function (role) {
            return role.id === _this.progroup.verificationRole;
          })[0];
          _this.__roleSelect = new _s2({
            data: {
              source: _this.__roleList,
              selected: selectedRole
            }
          }).$inject(_e._$getByClassName(_this.__methodPart, 'role-select')[0])
            .$on('change', function (_result) {
              _this.__autoRoleChange(_result.selected);
            }._$bind(_this));
        }
        _this.__pgApplyCache = _pgApplyCache._$$CachePGApplying._$allocate({
          onlistload: function () {
            var applyList = _this.__pgApplyCache._$getListInCache(_pgApplyCache._$cacheKey, {pgId: _this.pgid});
            _this.__applyList = _sl._$$ModuleStripedList._$allocate({
              xlist: applyList,
              parent: _this.__listParent,
              filter: function (list, listStates) {
                return _this.__filter(list, listStates);
              },
              batchAction: '',
              headers: [
                {
                  name: '帐号',
                  key: 'applicant.username',
                  valueType: 'deepKey'
                },
                {
                  name: '姓名',
                  key: 'applicant.realname',
                  valueType: 'deepKey'
                },
                {
                  name: '申请理由',
                  key: 'applyMessage'
                },
                {
                  name: '申请时间',
                  key: 'createTime',
                  valueType: 'time',
                },
                {
                  name: '操作结果',
                  key: '__nei-actions',
                  valueType: '__nei-actions'
                }
              ],
              defaultSortKey: 'createTime',
              isDefaultSortUp: false
            });
            //删除加载中提示，显示内容
            _e._$addClassName(_this.__loading, 'f-dn');
            _e._$delClassName(_this.__body, 'f-dn');
          },
          onverify: function (_result) {
            var applylist = _this.__pgApplyCache._$getListInCache(_pgApplyCache._$cacheKey, {pgId: _this.pgid});
            var list = _this.__filter(applylist, _this.__applyList._$getListStates());
            _this.__applyList._$update(list);
            //如果审核通过，就把该用户添加到项目组，更新cache
            if (_result.data.verifyResult == 1 || _result.data.verifyResult == 3) {
              _this.progroup = _this.__pgCache._$getItemInCache(_this.pgid);
              switch (_result.data.role) {
                case _dbConst.PRG_ROL_GUEST:
                  _this.progroup.observers.push(_result.data.applicant);
                  break;
                case _dbConst.PRG_ROL_AUDITOR:
                  _this.progroup.auditors.push(_result.data.applicant);
                  break;
                case _dbConst.PRG_ROL_ADMIN:
                  _this.progroup.admins.push(_result.data.applicant);
                  break;
                case _dbConst.PRG_ROL_DEVELOPER:
                  _this.progroup.developers.push(_result.data.applicant);
                  break;
                case _dbConst.PRG_ROL_TESTER:
                  _this.progroup.testers.push(_result.data.applicant);
                  break;
              }
            }

          }
        });
        _this.__pgApplyCache._$clearListInCache(_pgApplyCache._$cacheKey);
        _this.__pgApplyCache._$getList({
          key: _pgApplyCache._$cacheKey,
          data: {
            pgId: _this.pgid
          }
        });
      }
    };
    this.__listParent = _e._$getByClassName(this.__body, 'pg-pr-list')[0];
  };
  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__pgCache = _pgCache._$$CacheProGroup._$allocate(this.__pgCacheOptions);
    this.__methodPart = _e._$getByClassName(this.__body, 'pg-pr-method')[0];
    this.__typeChoose = _e._$getByClassName(this.__methodPart, 'type-choose');
    this.__super(_options);
    this.__doInitDomEvent([[
      window, 'accept-apply',
      function (evt) {
        this.__alert(evt.ids, true);
      }._$bind(this)
    ], [
      window, 'reject-apply',
      function (evt) {
        this.__alert(evt.ids, false);
      }._$bind(this)
    ], [
      this.__methodPart, 'click',
      this.__chooseMethod._$bind(this)
    ]]);
  };
  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    _e._$addClassName(this.__body, 'f-dn');
    _e._$delClassName(this.__loading, 'f-dn');
    this.pgid = _options.param.pgid;
    this.__super(_options);
    this.__pgCache._$getItem({
      id: this.pgid
    });
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    this.__applyList._$recycle();
    if (this.__roleSelect) {
      this.__roleSelect = this.__roleSelect.destroy();
    }
    this.__pgCache && this.__pgCache._$recycle();
    this.__pgApplyCache && this.__pgApplyCache._$recycle();
  };
  /**
   * 选择通过方式处理函数
   * @param  {[type]} event [description]
   * @return {Void}
   */
  _pro.__chooseMethod = function (event) {
    var selectIT = _v._$getElement(event, 'c:u-icon-radio-normal') || _v._$getElement(event, 'c:method-text');
    var oldSelect = _e._$getByClassName(this.__methodPart, 'j-selected')[0];
    var oldIcon = _e._$getByClassName(oldSelect, 'u-icon-radio-normal')[0];
    if (!selectIT) return;
    var select = selectIT.parentNode;
    if (select != oldSelect) {
      _e._$delClassName(oldSelect, 'j-selected');
      _e._$addClassName(select, 'j-selected');
      if (_e._$hasClassName(select, 'type-verify')) {
        this.__roleSelect = this.__roleSelect.destroy();
        this.__pgCache._$updateItem({data: {verification: 0}, id: this.pgid});
      } else {
        var selectedRole = this.__roleList.filter(function (role) {
          return role.id === _dbConst.PRG_ROL_GUEST;
        })[0];
        this.__roleSelect = new _s2({
          data: {
            source: this.__roleList,
            selected: selectedRole
          }
        }).$inject(_e._$getByClassName(this.__methodPart, 'role-select')[0])
          .$on('change', function (result) {
            this.__autoRoleChange(result.selected);
          }._$bind(this));
        this.__pgCache._$updateItem({data: {verification: 1, verificationRole: selectedRole.id}, id: this.pgid});
      }
    }
  };
  /**
   * 列表过滤函数
   * @param  {Array} list 待处理列表
   * @return {Array} list 处理完成的列表
   */
  _pro.__filter = function (list, listStates) {
    _u._$forEach(list, function (item) {
      var itemState = listStates[item.id];
      itemState['__nei-actions'] = '';
      switch (item.verifyResult) {
        case _dbConst.PRG_ROP_NONE:
          itemState['__nei-actions'] += '<a class="pass u-icon-yes-normal" title="通过" data-action=\'{"event":"accept-apply","ids":[' + item.id + ']}\'></a>' + '<a class="reject u-icon-no-normal" title="拒绝" data-action=\'{"event":"reject-apply","ids":[' +
            item.id + ']}\'></a>';
          itemState.__disabled = false;
          break;
        case _dbConst.PRG_ROP_PASS:
          var str = '已由' + item.verifier.realname + '通过为' + item.verifyMessage;
          itemState['__nei-actions'] += '<div title="' + str + '">' + str + '</div>';
          itemState.__disabled = true;
          break;
        case _dbConst.PRG_ROP_REFUSE:
          var str = '已拒绝（' + item.verifyMessage + '）';
          itemState['__nei-actions'] += '<div title="' + str + '">' + str + '</div>';
          itemState.__disabled = true;
          break;
        case _dbConst.PRG_ROP_SYSTEM:
          var str = '自动通过为' + item.verifyMessage;
          itemState['__nei-actions'] += '<div title="' + str + '">' + str + '</div>';
          itemState.__disabled = true;
          break;
      }
    }._$bind(this));
    return list;
  };
  /**
   * 处理申请的弹窗
   * @param  {Number} pgid 项目组ID
   * @return {Void}
   */
  _pro.__alert = function (pgids, flag) {
    if (!!flag) {
      this.__pgAcceptLayer = new _pal({
        data: {}
      });
      this.__pgAcceptLayer.$on('ok', function (option) {
        this._submit({v: _dbConst.CMN_BOL_YES, role: option.id, id: pgids[0], ext: {id: pgids[0]}});
        this.__pgAcceptLayer.destroy();
        this.__pgAcceptLayer = null;
      }._$bind(this));
    } else {
      this.__pgRejectLayer = new _prl({
        data: {}
      });
      this.__pgRejectLayer.$on('ok', function (option) {
        this._submit({v: _dbConst.CMN_BOL_NO, message: option.message, id: pgids[0], ext: {id: pgids[0]}});
        this.__pgRejectLayer.destroy();
        this.__pgRejectLayer = null;
      }._$bind(this));
    }
  };
  _pro._submit = function (data) {
    this.__pgApplyCache._$verify(data);
  };

  /**
   * 自动通过选择角色变化处理函数
   * @param  {String} value 所选择的角色
   * @return {Void}
   */
  _pro.__autoRoleChange = function (value) {
    this.__pgCache._$updateItem({
      data: {
        verification: _dbConst.PRG_VRF_PASS,
        verificationRole: value.id
      },
      id: this.pgid
    });
  };
  // notify dispatcher
  _m._$regist(
    'progroup-detail-pr',
    _p._$$ModuleProGroupDetailPR
  );
});
