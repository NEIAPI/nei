NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'pro/common/module'
], function (_k, _e, _v, _u, _m, _p, _pro) {

  _p._$$DraggerSort = _k._$klass();
  _pro = _p._$$DraggerSort._$extend(_m._$$Module);

  /**
   * 控件初始化
   * @return {void}
   */
  _pro.__init = function (options) {
    this.__super(options);
  };

  /**
   * 控件重置
   * @param  {object} options - 配置信息
   * @return {void}
   */
  _pro.__reset = function (options) {
    this.__super(options);
    this.mainDiv = options.parent;
    this.sortList = options.list;
    this.type = options.type;
    this.__doInitDomEvent([[
      this.sortList, 'mouseDown',
      this.__dragStart.bind(this)
    ]]);
  };

  /**
   * 控件销毁
   * @return {void}
   */
  _pro.__destroy = function () {
    this.__super();
    this.__doClearDomEvent();
  };

  /**
   * 拖拽开始
   * @return {void}
   */
  _pro.__dragStart = function (event) {
    if (event.button == 2 || _e._$hasClassName(event.target, 'j-tag')) {
      return;
    }
    var oLi = _v._$getElement(event, 'c:drag-li');
    var logo = _v._$getElement(event, 'c:info-logo');
    var reslink = _v._$getElement(event, 'c:resource');
    var itemlink = _v._$getElement(event, 'c:item-link');
    if (_e._$hasClassName(oLi, 'item-top') || _e._$hasClassName(oLi, 'item-pub') || logo || reslink || itemlink) return;
    if (oLi == null || _e._$hasClassName(oLi, 'res-add')) {
      return;
    }
    //取得排序前的顺序id数组
    this._oldIds = [];
    var pgLis = _e._$getChildren(this.sortList, 'drag-li');
    _u._$forEach(pgLis, function (item) {
      this._oldIds.push(_e._$dataset(item, 'resId'));
    }.bind(this));

    var oCopyLi = oLi.cloneNode(true);
    var oNewLi = document.createElement('li');
    _e._$addClassName(oNewLi, 'res-item');
    _e._$addClassName(oNewLi, 'drag-li');
    var offL = _e._$offset(oLi, document.body).x + 'px';
    var offT = _e._$offset(oLi, document.body).y + 'px';
    var width = _e._$getStyle(oLi, 'width');
    //_e._$setStyle(oNewLi,'width',width);
    //复制节点和新节点的样式调整
    _e._$addClassName(oCopyLi, 'j-newli');
    document.body.appendChild(oCopyLi);
    _e._$style(oCopyLi, {left: offL, top: offT, width: width});

    //替换节点,增加类
    oLi.parentNode.replaceChild(oNewLi, oLi);
    _e._$addClassName(oNewLi, 'j-border');

    var _downX = _v._$clientX(event);
    var _downY = _v._$clientY(event);
    var _offsetLeft = oCopyLi.offsetLeft;
    var _offsetTop = oCopyLi.offsetTop;

    _v._$addEvent(document, 'mouseMove', this.__dragging.bind(this, oNewLi, oCopyLi, _downX, _downY, _offsetLeft, _offsetTop));
    _v._$addEvent(document, 'mouseUp', this.__dragEnd.bind(this, oNewLi, oCopyLi, oLi));
  };

  /**
   * 拖拽中
   * @return {void}
   */
  _pro.__dragging = function (oNewLi, oCopyLi, dX, dY, oL, oT, event) {
    var aLiList = _e._$getChildren(this.sortList, 'drag-li');
    var _aLiList = [];
    var _X = _v._$clientX(event);
    var _Y = _v._$clientY(event);
    var _mLeft = oL + _X - dX;
    var _mTop = oT + _Y - dY; //当前oCopyLi的offset
    var oSize = this.__overBorder(_mLeft, _mTop); //边界检测
    _mLeft = oSize.left || _mLeft;
    _mTop = oSize.top || _mTop;
    console.log(_mLeft);
    console.log(_mTop);
    _e._$style(oCopyLi, {left: _mLeft + 'px', top: _mTop + 'px'});
    var index = this.__getDragLocation(_mLeft, _mTop);
    console.log(index);
    if (index === null) return;
    _u._$forEach(aLiList, function (item) {
      if (!_e._$hasClassName(item, 'j-border')) {
        _aLiList.push(item);
      }
    }.bind(this));
    this.__insertDiv(_Y, _aLiList[index], oNewLi, this.sortList);
  };

  /**
   * 拖拽完成
   * @return {void}
   */
  _pro.__dragEnd = function (oNewLi, oCopyLi, oLi, event) {
    var ids = [];
    var left = _e._$offset(oNewLi, document.body).x;
    var top = _e._$offset(oNewLi, document.body).y;
    this.__animate(oCopyLi, {left: left, top: top}, 100, function () {
      _e._$remove(oCopyLi, false);
      oNewLi.parentNode.replaceChild(oLi, oNewLi);
      _e._$delClassName(oNewLi, 'j-border');
      _v._$clearEvent(document, 'mouseMove mouseUp');

      var pgLis = _e._$getChildren(this.sortList, 'drag-li');
      _u._$forEach(pgLis, function (item) {
        ids.push(_e._$dataset(item, 'resId'));
      });
      if (ids.toString() != this._oldIds.toString()) {
        this._$dispatchEvent('dragEnd', ids);
      }
    }.bind(this));
  };

  /**
   * 获取元素位置
   * @param  {Number} oLeft
   * @param  {Number} oTop
   * @return {Number} this._index
   */
  _pro.__getDragLocation = function (oLeft, oTop) {
    var aLiList = _e._$getChildren(this.sortList, 'drag-li');
    var index = null;
    var liW = aLiList[0].offsetWidth;
    var liH = aLiList[0].offsetHeight;
    for (var i = 0; i < aLiList.length; i++) {
      var left = _e._$offset(aLiList[i], document.body).x;
      var top = _e._$offset(aLiList[i], document.body).y;
      if (oLeft > left - liW + 50 && oLeft < left + liW - 50 && oTop > top - liH + 50 && oTop < top + liH - 50) {
        index = i;
        break;
      }
    }
    return index;
  };

  /**
   * 鼠标移动变换效果
   * @param  {Number}        y            - 偏移
   * @param  {Object}        oldElem        - 旧节点
   * @param  {Object}        newElem        - 新节点
   * @param  {Object}        parent        - 父节点
   */
  _pro.__insertDiv = function (y, oldElem, newElem, parent) {
    var top = _e._$offset(parent, document.body).y;
    var left = _e._$offset(parent, document.body).x;
    var list = _e._$getChildren(parent, 'item-normal');
    if (!oldElem) {
      if (!!_e._$getByClassName(this.mainDiv, 'item-pub')[0]) {
        oldElem = _e._$getByClassName(this.mainDiv, 'item-pub')[0];
      } else {
        oldElem = _e._$getByClassName(this.mainDiv, 'res-add')[0];
      }
    } else {
      if (_e._$hasClassName(oldElem, 'item-top')) {
        //如果非置顶数组为空，则插入到公共默认之前
        if (list.length) {
          oldElem = list[0];
        } else {
          oldElem = _e._$getByClassName(this.mainDiv, 'item-pub')[0];
        }
      }
    }
    if (y > top && y < top + parent.offsetHeight) {
      try {
        parent.insertBefore(newElem, oldElem);
      } catch (e) {
        var pubElem = _e._$getByClassName(this.mainDiv, 'item-pub')[0];
        parent.appendChild(newElem, pubElem);
      }
    }
  };

  /**
   * 边界检查
   * @param  {Number} left
   * @param  {Number} top
   * @return {object}
   */
  _pro.__overBorder = function (left, top) {
    var x = 0;
    var y = 0;
    var mainDiv = this.mainDiv;
    var oSize = {};
    var mainOffset = _e._$offset(mainDiv, document.body);
    if (left < mainOffset.x) {
      x = mainOffset.x;
    }
    if (left > mainDiv.offsetLeft + mainDiv.offsetWidth) {
      x = mainDiv.offsetLeft + mainDiv.offsetWidth;
    }
    if (top < mainOffset.y) {
      y = mainOffset.y;
    }
    if (top > mainOffset.y + mainDiv.offsetHeight) {
      y = mainOffset.y + mainDiv.offsetHeight;
    }
    oSize.left = x;
    oSize.top = y;
    return oSize;
  };

  /**
   * 自定义简单动画函数
   * @param  {object} node   - 动画节点
   * @param  {object} params - 动画信息
   * @param  {number} time   - 持续时间
   * @param  {Function} callback
   * @return {void}
   */
  _pro.__animate = function (node, params, time, callback) {
    var _style = node.currentStyle ? node.currentStyle : window.getComputedStyle(node, null);
    time = document.all ? time * 0.6 : time * 0.9;
    for (var p in params) {
      (function (n) {
        n = p;
        if (n == 'left' || n == 'top') {
          var _old = parseInt(_style[n]);
          var _new = parseInt(params[n]);
          var _tt = 10;
          if (!isNaN(_old)) {
            var count = _old;
            var length = _old <= _new ? (_new - _old) : (_old - _new);
            var speed = length / time * _tt;
            var flag = 0;
            var anim = setInterval(function () {
              node.style[n] = count + 'px';
              count = _old <= _new ? count + speed : count - speed;
              flag += _tt;
              if (flag >= time) {
                node.style[n] = _new + 'px';
                clearInterval(anim);
              }
            }, _tt);
          }
        }
      })(p);
    }
    var timeHandler = setTimeout(function () {
      if (callback && typeof callback == 'function') {
        callback();
        clearTimeout(timeHandler);
      }
    }, time + 100);
  };

  return _p;
});
