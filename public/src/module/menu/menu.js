/**
 * 项目组列表树的操作权限菜单组件--------------------------------------------------
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/element',
  'base/event',
  'pro/common/util',
  'text!./menu.html',
  'css!./menu.css'
], function (base, _e, _v, _cu, tpl, css) {
  // 加载一次即可
  _e._$addStyle(css);
  var Menu = base.extend({
    name: 'menu',
    template: tpl,
    /**
     * @protected
     */
    config: function (data) {
      this.data.triggerTime = data.triggerTime || 150; // 子菜单隐藏或者显示延时
      this.supr(this.data);
    },
    /**
     * @protected
     */
    init: function () {
      this.supr();
      // 证明不是内嵌组件
      if (this.$root === this) {
        this.$inject(document.body);
      }

      function bdClick() {
        this.hide();
      }

      setTimeout(function () {
        this._bdClickHandler = bdClick.bind(this);
        _v._$addEvent(document.body, 'click', this._bdClickHandler);
      }.bind(this), 0);
    },
    itemClick: function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      var elem = _v._$getElement(evt, 'd:action');
      if (elem) {
        var itemAction = _e._$dataset(elem, 'action');
        var menuItem = this.data.xlist.find(function (item) {
          return item.action === itemAction;
        });
        if (menuItem) {
          if (!menuItem.children || menuItem.children.length === 0) {
            this.$emit('click', itemAction);
          }
        }
      }
    },
    subItemClick: function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      var elem = _v._$getElement(evt, 'd:action');
      if (elem) {
        var itemAction = _e._$dataset(elem, 'action');
        this.$emit('click', this._showAction, itemAction);
      }
    },
    /**
     * 显示子菜单
     *
     * @param  {Element} elem 一级菜单项节点
     * @return {void}
     */
    showSubMenu: function (elem) {
      var itemAction = _e._$dataset(elem, 'action');
      if (this._showAction === itemAction) { // 当前action已经显示了
        return;
      }
      var menuItem = this.data.xlist.find(function (item) {
        return item.action === itemAction;
      });
      this.data.childList = menuItem.children;
      this._showAction = itemAction;
      this.$update();
      var childMenu = this.$refs.childMenu;
      var elemPos = elem.getBoundingClientRect();
      var menuHight = childMenu.offsetHeight;
      var menuWidth = childMenu.offsetWidth;
      var docHeight = document.body.clientHeight;
      var docWidth = document.body.clientWidth;
      if (elemPos.top + menuHight - 1 > docHeight) {
        _e._$setStyle(childMenu, 'top', elem.offsetTop - (elemPos.top + menuHight - docHeight) + 'px');
      } else {
        _e._$setStyle(childMenu, 'top', elem.offsetTop - 1 + 'px');
      }
      if (elemPos.left + elemPos.width + menuWidth - 1 > docWidth) { // 超出右边界
        _e._$setStyle(childMenu, 'left', 2 - menuWidth + 'px');
      } else {
        _e._$setStyle(childMenu, 'left', elemPos.width + 'px');
      }
    },
    /**
     * 切换子菜单显示
     *
     * @param  {Event}  evt    事件对象
     * @param  {boolean} isShow 显示还是隐藏
     * @return {void}
     */
    toggleSubmenu: function (evt, isShow) {
      var me = this;
      clearTimeout(this._showTimer);
      clearTimeout(this._hideTimer);
      if (isShow) {
        var elem = _v._$getElement(evt);
        this._showTimer = setTimeout(this.showSubMenu.bind(this, elem), this.data.triggerTime);
      } else {
        this._hideTimer = setTimeout(function () {
          delete me._showAction;
          delete me.data.childList;
          me.$update();
        }, this.data.triggerTime);
      }
    },
    /**
     * 进入子菜单事件
     *
     * @param  {Event}  evt    事件对象
     * @return {void}
     */
    enterSubmenu: function (evt) {
      if (this._hideTimer) {
        clearTimeout(this._hideTimer);
      }
    },
    destroy: function () {
      _v._$delEvent(document.body, 'click', this._bdClickHandler);
      delete this._bdClickHandler;
      clearTimeout(this._showTimer);
      clearTimeout(this._hideTimer);
      this.supr();
    },
    hide: function () {
      this.$emit('hide');
      this.destroy();
    }
  });
  return Menu;
});
