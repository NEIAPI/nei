/**
 * 选项卡组件
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/element',
  'base/event',
  'util/event',
  'css!./tab.css'
], function (k, u, e, v, t, css, p, pro) {

  p._$$ModuleTab = k._$klass();
  pro = p._$$ModuleTab._$extend(t._$$EventTarget);

  e._$addStyle(css);

  // 默认配置参数
  var defaultOptions = {
    // 列表容器
    tab: null,
    // 选中的样式类名
    selectedClass: 'js-selected',
    // 选中的样式类名
    hoveredClass: 'js-hovered',
    // dataset 的 key
    datasetKey: 'id'
  };
  pro.__init = function (_options) {
    this.__super(_options);
    // TODO
  };
  pro.__reset = function (options) {
    this.__super(options);
    this._options = u._$merge({}, defaultOptions, options);
    if (!this._options.tab) {
      return;
    }
    this._tabs = e._$getChildren(this._options.tab, 'tab');
    this._hlEl = e._$create('div', 'hl', this._options.tab);
    this._addEvent();
  };

  /**
   * 高亮指定索引的选项卡
   * @param  {Number} index - 要高亮的选项卡索引
   * @param  {Boolean} [init=false] - 是否是初始匹配, 默认为 false, 初始匹配不需要动画效果
   * @param  {Boolean} [isHover=false] - 是否是hover
   * @return {Node} - 高亮的选项卡节点
   */
  pro._highlight = function (index, init, isHover) {
    var selectedTab = null;
    if (init) {
      e._$setStyle(this._hlEl, 'opacity', 0);
    }
    u._$forEach(this._tabs, function (tab, idx) {
      if (idx === index) {
        e._$addClassName(tab, isHover ? this._options.hoveredClass : this._options.selectedClass);
        e._$setStyle(this._hlEl, 'width', e._$getStyle(tab, 'width'));
        e._$setStyle(this._hlEl, 'left', tab.offsetLeft + 'px');
        selectedTab = tab;
      } else {
        e._$delClassName(tab, isHover ? this._options.hoveredClass : this._options.selectedClass);
      }
    }, this);
    if (init) {
      setTimeout(function () {
        e._$setStyle(this._hlEl, 'opacity', 1);
      }.bind(this), 100);
    }
    return selectedTab;
  };

  pro._addEvent = function () {
    u._$forEach(this._tabs, function (tab, idx) {
      v._$addEvent(tab, 'mouseover', function (evt) {
        this._highlight(idx, false, true);
      }.bind(this), false);
      v._$addEvent(tab, 'mouseout', function (evt) {
        this._highlight(this._highlightIndex, false, true);
      }.bind(this), false);
    }, this);
  };

  /**
   * 验证匹配情况
   * @param  {String} value - 待匹配值
   * @return {Node} - 匹配的节点
   */
  pro._$match = function (value) {
    var event = {target: value};
    u._$forEach(this._tabs, function (tab, idx) {
      delete event.matched;
      event.source = e._$dataset(tab, this._options.datasetKey);
      this._$dispatchEvent('oncheck', event);
      if (event.matched) {
        this._highlightIndex = idx;
      } else {
        e._$delClassName(tab, this._options.hoveredClass + ' ' + this._options.selectedClass);
      }
    }, this);
    return this._highlight(this._highlightIndex, true);
  };
  // 控件回收销毁过程
  pro.__destroy = function () {
    this.__super();
    // TODO
  };
});
