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
  'pro/common/regular/regular_base',
  'pro/stripedlist/stripedlist',
  'json!{3rd}/fb-modules/config/db.json',
  'pro/common/regular/regular_progroup'
], function (_k, _e, _u, _v, _t, _l, _m, _pgCache, pgApplyCache, _r, _sl, _dbConst, proGroupTree, _p, _pro) {

  _p._$$ModuleProGroupApplylist = _k._$klass();
  _pro = _p._$$ModuleProGroupApplylist._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-progroup-applylist')
    );
    this.__listParent = _e._$getByClassName(this.__body, 'apply-list')[0];
    this.__pgApplyCacheOptions = {
      onlistload: function () {
        var applyinglist = this.__pgApplyCache._$getListInCache(pgApplyCache._$cacheKey);
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onlistload: function (result) {
            var proGroupList = this.__pgCache._$getListInCache(_pgCache._$cacheKey);
            this.__proGroupIdList = proGroupList.map(function (item) {
              return item.id;
            });
            //申请通过，但是被请出项目组的列表
            this.__deleteList = [];
            if (!!result.ext && result.ext.origin == 'applylist') {
              _u._$forEach(result.ext.list, function (item2) {
                if (this.__proGroupIdList.indexOf(item2) == -1) {
                  //已经删除的
                  this.__deleteList.push(item2);
                }
              }._$bind(this));
              //触发listchange, 重新渲染项目组树以及卡片列表
              _v._$dispatchEvent(
                _pgCache._$$CacheProGroup, 'listchange', {
                  key: _pgCache._$cacheKey,
                }
              );
              return;
            }
            this.__applyList = _sl._$$ModuleStripedList._$allocate({
              xlist: applyinglist,
              parent: this.__listParent,
              filter: function (list, listStates) {
                var adminNames = [];
                //flag表示该申请列表是不是存在于当前项目组列表
                var flag = true;
                //申请通过，但是不存在当前项目组的列表
                var notExistList = [];
                _u._$forEach(list, function (item) {
                  var itemState = listStates[item.id];
                  itemState.__disabled = true;
                  delete itemState['__nei-actions'];
                  if (item.applyingProGroup.admins.length > 0) {
                    item.administrator = item.applyingProGroup.admins[0].realname + ' 等';
                  } else {
                    item.administrator = '暂无';
                  }
                  switch (item.verifyResult) {
                    case _dbConst.PRG_ROP_NONE:
                      item.applyinfo = '审批中';
                      break;
                    case _dbConst.PRG_ROP_PASS:
                    case _dbConst.PRG_ROP_SYSTEM:
                      if (item.verifyResult == _dbConst.PRG_ROP_PASS) {
                        item.applyinfo = item.verifier.realname + '通过您为' + item.verifyMessage;
                      } else {
                        item.applyinfo = '自动通过为' + item.verifyMessage;
                      }
                      //当前申请是不是在项目组列表里
                      flag = this.__proGroupIdList.indexOf(item.progroupId) != -1;
                      //当前申请成功的项目组不在当前项目组列表里，并且没有被请出当前项目组（刚刚申请成功，还没刷新页面的情况）
                      if (!flag && this.__deleteList.indexOf(item.progroupId) == -1) {
                        if (notExistList.indexOf(item.progroupId) == -1) {
                          notExistList.push(item.progroupId);
                        }
                        return;
                      }
                      break;
                    case _dbConst.PRG_ROP_REFUSE:
                      item.applyinfo = '被拒绝（' + item.verifyMessage + ')';
                      break;
                  }
                }._$bind(this));
                //如果存在刚刚申请通过还没刷新页面的项目组
                if (notExistList.length) {
                  this.__pgCache._$clearListInCache(_pgCache._$cacheKey);
                  this.__pgCache._$getList({
                    key: _pgCache._$cacheKey,
                    ext: {origin: 'applylist', list: notExistList}
                  });
                }
                return list;
              }._$bind(this),
              sortKey: 'applyingProGroup.name',
              headers: [
                {name: '项目组名称', key: 'applyingProGroup.name', valueType: 'deepKey'},
                {name: '管理员', key: 'administrator'},
                {name: '申请结果', key: 'applyinfo'}
              ]
            });
          }._$bind(this)
        });
        this.__pgCache._$getList({
          key: _pgCache._$cacheKey
        });


      }._$bind(this)
    };
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    this.__pgApplyCache._$clearListInCache(pgApplyCache._$cacheKey);
    this.__pgApplyCache._$getList({key: pgApplyCache._$cacheKey});
  };

  _pro.__onShow = function (_options) {
    this.__pgApplyCache = pgApplyCache._$$CachePGApplying._$allocate(this.__pgApplyCacheOptions);
    this.__super(_options);
    this.__searchForm = _e._$getByClassName(this.__body, 'search-form')[0];
    this.__searchIpt = _e._$getByClassName(this.__body, 'j-pg-search')[0];
    this.__searchBtn = _e._$getByClassName(this.__body, 'search-icon')[0];
    this.__doInitDomEvent([[
      this.__searchIpt, 'focus', function () {
        _e._$addClassName(this.__searchForm, 'z-border');
      }._$bind(this)
    ], [
      this.__searchIpt, 'blur', function () {
        _e._$delClassName(this.__searchForm, 'z-border');
      }._$bind(this)
    ], [
      this.__searchIpt, 'keydown',
      this.__search._$bind(this)
    ], [
      this.__searchBtn, 'click',
      this.__search._$bind(this)
    ]]);
  };

  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    if (this.__applyList) {
      this.__applyList = this.__applyList._$recycle();
    }
    this.__searchIpt.value = '';
    !!this.__pgApplyCache && this.__pgApplyCache._$recycle();
  };

  _pro.__search = function (event) {
    var searchKey = this.__searchIpt.value.trim();
    if (!searchKey) return;
    if (event.type == 'keydown') {
      var currKey = event.keyCode || event.which || event.charCode;
      if (currKey != 13) return;
    }
    dispatcher._$redirect('/search/group?s=' + searchKey);
  };

  _m._$regist(
    'progroup-applylist',
    _p._$$ModuleProGroupApplylist
  );
});
