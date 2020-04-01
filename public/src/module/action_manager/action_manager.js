/**
 * 统一行为管理组件
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/element',
  'base/event',
  'pro/common/module',
  'pro/modal/modal',
  'pro/cache/config_caches',
  'pro/notify/notify',
], function (k, u, e, v, m, Modal, caches, _notify, p, pro) {
  p._$$ActionManager = k._$klass();
  pro = p._$$ActionManager._$extend(m._$$Module);

  pro.__reset = function (options) {
    this.__super(options);
    this.__doInitDomEvent([[
      document, 'click',
      this.__onClickAction._$bind2(this, 'click'),
      false
    ]]);
  };

  pro.__onClickAction = function (evt, evtType) {
    // 可编辑输入框
    var target = v._$getElement(evt, 'd:action');
    if (!target) return;
    var actionData;
    try {
      actionData = JSON.parse(e._$dataset(target, 'action'));
    } catch (err) {
      return console.error(err);
    }
    switch (actionData.type) {
      case 'modify':
        v._$stopBubble(evt);
        pro.__modifyInputValue(target, actionData);
        break;

      case 'del':
        v._$stop(evt);
        pro.__deleteItems(target, actionData);
        break;

      case 'read': //消息标记已读操作
        v._$stop(evt);
        pro.__setRead(actionData);
        break;

      default:
        if (actionData.event) {
          v._$stop(evt);
          // 模块自身需要监听的事件, 挂在 window 对象上
          v._$dispatchEvent(
            window, actionData.event, actionData
          );
        }
    }
  };

  /**
   * 可编辑输入框元素上 data-action 的含义:
   * cache: 所使用的缓存
   * name: 所更新的字段名称
   * id: 要更新的对象的id
   * pattern: 验证正则
   * ext
   * dataExt: 自定义数据字段
   * data-action 的示例值: {"cache":"user","name":"name","id":"1465726373492"}
   */
  pro.__modifyInputValue = function (input, actionData) {
    var _this = this;
    // 接口详情页面的描述用的是 textarea，用脚本操作 readOnly 属性时，不能及时生效，现象就是得到焦点时，还是不能输入文字
    // 解决方案是临时区分下 textarea 和 input。对 input 不做改动，不然影响范围有点大
    if (input.tagName === 'TEXTAREA') {
      if (input.getAttribute('isEditing') === 'true') {
        // 已经是编辑状态
        return;
      }
      input.setAttribute('isEditing', 'true');
    } else {
      if (!input.readOnly) {
        // 已经是编辑状态
        return;
      }
      input.readOnly = false;
    }
    input.select();
    var oldValue = input.value;
    var handler = function (evt) {
      if (input.tagName === 'TEXTAREA') {
        input.setAttribute('isEditing', 'false');
      } else {
        input.readOnly = true;
      }
      var newValue = input.value.trim();
      var target = v._$getElement(evt, 'c:title');
      if (actionData.cache == 'datatype' && target) {
        var pattern = new RegExp(/^[\w]{1,100}$/);
        if (!pattern.test(newValue)) {
          _notify.error('数据模型名称必须是以英文字母，数字，下划线组成的1-100字符');
          input.value = oldValue;
          return;
        }
      }
      input.value = newValue;
      if (actionData.required && newValue === '') {
        input.value = oldValue;
      } else if (newValue !== oldValue) {
        // 校验
        if (actionData.pattern) {
          try {
            var regex = new RegExp(actionData.pattern);
            // 接口路径的规范，只检查 path variable，query string 不检查
            if (!regex.test(actionData.isPathInput ? newValue.split('?')[0] : newValue)) {
              _notify.show(actionData.errorMsg.replace('{{value}}', newValue) || '', 'error', 3000);
              if (!actionData.continueOnError) {
                input.value = oldValue;
                return;
              }
            }
          } catch (err) {}
        }
        // 发送更新请求
        var onerror = function (evt) {
          // 修改值失败，还原为原来的值
          input.value = oldValue;
        }
        var cache = _this._getCache(actionData.cache, onerror);
        if (!cache) {
          return console.error('cache "' + actionData.cache + '" not found');
        }
        var sendData = {
          id: actionData.id,
          data: {},
          name: actionData.name,
          ext: actionData.ext
        };
        sendData.data[actionData.name] = newValue;
        if (actionData.dataExt) {
          Object.keys(actionData.dataExt).forEach(
            function (key) {
              sendData.data[key] = actionData.dataExt[key];
            }
          )
        }
        cache._$updateItem(sendData);
      }
      v._$delEvent(input, 'blur', handler);
      v._$delEvent(input, 'keydown', keydownHandler);
      //修改textarea值得同时修改title
      var textarea = v._$getElement(evt, 't:textarea');
      if (!!textarea) {
        e._$attr(textarea, 'title', textarea.value);
      }
    }
    var keydownHandler = function (evt) {
      //如果是textarea 则让他回车换行，而不是更新数据
      var textarea = v._$getElement(evt, 'c:u-m-txt');
      if (evt.keyCode === 13 && !textarea) {
        handler();
      }
    }
    v._$addEvent(input, 'blur', handler);
    v._$addEvent(input, 'keydown', keydownHandler);
  };

  /**
   * 批量删除动作
   * 元素上 data-action 的含义:
   * cache: 所使用的缓存
   * ids: 要删除的对象id列表
   * warn: 删除前是否要显示提示对话框, 默认显示
   * tip: 删除前的提示文案, 默认为 "确定要删除吗?"
   * 还可以存放其他字段, 方便检测操作
   *
   * data-action 的示例值: {"cache":"page","ids":"1,2,3"}
   */
  pro.__deleteItems = function (node, actionData) {
    var delHandler = function () {
      this._getCache(actionData.cache)._$deleteItems({
        data: {
          ids: actionData.ids
        },
        // 这个属性在批量删除完成的事件中会用到, 需要自己设置
        action: actionData.action,
        key: actionData.key
      });
    }.bind(this);
    var isIncludeSharedItem = actionData.items && actionData.items.find(function (item) {
      return item.isShare;
    });
    if (actionData.warn) {
      var obj = {};
      obj.content = actionData.tip || '确定要删除吗?';
      if (isIncludeSharedItem) {
        obj.content += '<br/>提示：你要删除的资源中包含了公共资源库中的资源，删除后该资源会从所有项目中移除。'
      }
      var modal = Modal.confirm(obj);
      modal.$on('ok', delHandler);
    } else {
      delHandler();
    }
  };

  /**
   * 消息批量标记已读操作
   * 元素上 data-action 的含义:
   * type: 消息类型（system,personal）
   * key: 缓存列表key
   * ids: 要标记已读的对象id列表
   * 还可以存放其他字段, 方便检测操作
   */
  pro.__setRead = function (actionData) {
    var cache = caches['notification']._$allocate();
    cache._$setRead({
      type: actionData.keyType,
      key: actionData.key,
      ids: actionData.ids,
      isAll: actionData.isAll
    });
  };

  pro._getCache = function (cacheName, onerror) {
    var cache = caches[cacheName];
    return cache && cache._$allocate({
      onerror: onerror
    });
  };

  return p._$$ActionManager._$allocate();

});
