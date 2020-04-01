NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/template/tpl',
  'pro/common/module',
  'util/template/jst',
  'ui/datepick/datepick',
  'pro/cache/pat_cache',
  'pro/stripedlist/stripedlist',
  'json!{3rd}/fb-modules/config/db.json',
  'pro/common/util',
  'pro/modal/modal',
  'pro/notify/notify'
], function (_k, _e, _v, _u, _l, _m, _j, datePick, patCache, stripedlist, _db, _cu, _modal, Notify, _p, _pro) {
  _p._$$ModuleSettingPAT = _k._$klass();
  _pro = _p._$$ModuleSettingPAT._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-setting-pat')
    );
  };

  _pro.__onShow = function (_options) {
    this.__doInitDomEvent([
      [
        this.__body, 'click',
        function (evt) {
          var node = _v._$getElement(evt, 'd:click');
          if (!node) {
            return;
          }
          var obj = JSON.parse(_e._$dataset(node, 'click'));
          switch (obj.type) {
            case 'datepick':
              this.__datePick = datePick._$$DatePick._$allocate({
                parent: _e._$getByClassName(this.__body, 'u-ps-time')[0],
                date: node.value,
                onchange: function (date) {
                  node.value = _u._$format(date, 'yyyy/MM/dd');
                }.bind(this)
              });
              break;
            case 'checkbox':
              node.classList.toggle('u-icon-checkbox-pressed');
              break;
            case 'submit':
              this.__submit();
              break;
            default:
              break;
          }
          _v._$stopBubble(evt);
        }.bind(this)
      ], [
        document, 'click', function () {
          this.__datePick && this.__datePick._$recycle();
          this.__datePick = null;
        }.bind(this)
      ],
      [
        _e._$getByClassName(this.__body, 'token-copy')[0], 'click',
        function (e) {
          var tokenEl = _e._$getByClassName(this.__body, 'token')[0];
          _cu._$copyText(tokenEl.innerHTML);
          Notify.success('访问令牌已复制，请妥善保存', 5000);
        }.bind(this)
      ]
    ]);
    this.__patListEl = _e._$getByClassName(this.__body, 'pat-list')[0];
    this.patCache = patCache._$$CachePAT._$allocate({
      onitemadd: function (data) {
        this._showGenPat(data.data);
        this._showPats();
      }.bind(this),
      onitemdelete: function (data) {
        this._showPats();
      }.bind(this)
    });
    this._showPats();
    this.__super(_options);
  };

  _pro._showGenPat = function (data) {
    var successTipEl = _e._$getByClassName(this.__body, 'm-ps-gen-success')[0];
    var tokenNameEl = _e._$getByClassName(successTipEl, 'token-name')[0];
    var tokenEl = _e._$getByClassName(successTipEl, 'token')[0];
    var patListEl = _e._$getByClassName(this.__body, 'pat-list-wrap')[0];
    tokenNameEl.innerHTML = data.name;
    tokenEl.innerHTML = data.token;
    successTipEl.classList.remove('f-dn');
    patListEl.classList.add('show-gen-success');
  };

  _pro.__submit = function () {
    var name = _e._$getByClassName(this.__body, 'name-value')[0];
    var read = _e._$getByClassName(this.__body, 'read-value')[0];
    var canRead = read.classList.contains('u-icon-checkbox-pressed');
    var write = _e._$getByClassName(this.__body, 'write-value')[0];
    var canWrite = write.classList.contains('u-icon-checkbox-pressed');
    var description = _e._$getByClassName(this.__body, 'description-value')[0];
    var expire = _e._$getByClassName(this.__body, 'expire-value')[0];
    var rowItems = _e._$getByClassName(this.__body, 'm-ps-item');
    var canSubmit = true;
    if (!name.value.trim()) {
      rowItems[0].classList.add('m-ps-item-error');
      canSubmit = false;
    } else {
      rowItems[0].classList.remove('m-ps-item-error');
    }
    if (!canRead && !canWrite) {
      rowItems[1].classList.add('m-ps-item-error');
      canSubmit = false;
    } else {
      rowItems[1].classList.remove('m-ps-item-error');
    }
    if (!canSubmit) {
      return;
    }
    var sendData = {
      name: name.value,
      privilege: parseInt((canRead ? '1' : '0') + (canWrite ? '1' : '0'), 2),
      description: description.value,
      expire: expire.value,
    };
    this.patCache._$addItem({
      key: this.patCache._$cacheKey,
      data: sendData
    });
  };

  _pro._showPats = function () {
    this._stripedListOptions = {
      // 父容器
      parent: this.__patListEl,
      listCache: 'pat',
      listCacheKey: patCache._$cacheKey,
      // 处理数据
      filter: function (list, listStates) {
        // 处理 action 列
        list.forEach(function (item) {
          var itemState = listStates[item.id];
          var obj = {
            type: 'del',
            warn: true,
            cache: 'pat',
            key: patCache._$cacheKey,
            ids: [item.id],
            items: [{
              id: item.id
            }],
            tip: '确定要删除该访问令牌吗？删除后再也无法使用该令牌访问资源。'
          };
          var str = '<a class="delete-icon" data-action=' + JSON.stringify(obj) + ' title="删除当前项"><em class="u-icon-delete-normal"></em></a>';

          itemState['__nei-actions'] = str;
        });
        return list;
      },
      // 要显示的字段
      headers: this._getStripedListHeader(),
      noItemTip: '你还未创建过访问令牌'
    };

    if (this.__list) {
      this.__list._$refresh(this._stripedListOptions);
    } else {
      this.__list = stripedlist._$$ModuleStripedList._$allocate(this._stripedListOptions);
    }
  };

  _pro._getStripedListHeader = function () {
    return [
      {name: '名称', key: 'name'},
      {name: '访问权限', key: 'privilege', valueType: 'pat-privilege'},
      {name: '描述', key: 'description'},
      {name: '过期时间', key: 'expire', valueType: 'expireTime'},
      {name: '创建时间', key: 'createTime', valueType: 'time'},
      {
        name: '',
        key: '__nei-actions',
        valueType: '__nei-actions',
        sortable: false
      }
    ];
  };

  _pro.__onHide = function (_options) {
    this.__doClearDomEvent();
    this.patCache && this.patCache._$recycle();
    this.__super(_options);
  };

  _m._$regist(
    'setting-personal-access-token',
    _p._$$ModuleSettingPAT
  );
});
