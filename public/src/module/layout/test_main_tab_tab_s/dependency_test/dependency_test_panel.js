/*
 * 依赖测试面板
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/notify/notify',
  'text!./dependency_test_panel.html',
  'css!./dependency_test_panel.css'
], function (rb, v, u, e, util, notify, html, css) {
  // 加载一次
  e._$addStyle(css);

  var LAYER_TYPE = {
    INTERFACE: 'INTERFACE',
    RULE: 'RULE'
  };

  var defaultOptions = {
    drawOptions: {
      layerHeight: 100,
      interface: {
        width: 150,
        height: 35,
        marginX: 3,
        marginY: 5
      },
      rule: {
        xLength: 75,
        yLength: 25
      },
      menu: {
        radius: 18,
        marginX: 2,
        marginY: 5
      },
      text: {
        font: '16px MicroSoft YaHei',
        fillStyle: 'black'
      }
    }
  };

  var DependencyTestPanel = rb.extend({
    name: 'dependency-test-panel',
    template: html,
    config: function () {
      this.data = u._$merge({}, defaultOptions, this.data);
      this.copyLayerList();
      this.$watch('numOfLayers', function (length) {
        if (this.$root.parentNode) {
          var height = length * this.data.drawOptions.layerHeight;
          this.$refs.canvas.height = height;
          if (this.$refs.canvas.width === 0) {
            this.$refs.canvas.width = this.$root.parentNode.clientWidth;
          }
          if (length === 0) {
            this.$refs.canvas.height = this.data.drawOptions.layerHeight;
          }
          this.draw();
        }
      });
    },
    computed: {
      numOfLayers: {
        get: function (data) {
          return data.layers.length;
        }
      }
    },
    init: function () {
      this.$refs.canvas.height = this.data.layers.length * this.data.drawOptions.layerHeight;
      setTimeout(function () {
        var length = this.data.layers.length;
        this.$refs.canvas.width = this.parentNode.clientWidth;
        if (length === 0) {
          this.$refs.canvas.height = this.data.drawOptions.layerHeight;
        } else {
          this.$refs.canvas.height = length * this.data.drawOptions.layerHeight;
        }
        this.draw();
      }.bind(this), 0);
      this.resizeHandler = function () {
        this.$refs.canvas.width = this.$root.parentNode.clientWidth;
        if (this.reports) {
          this.setErrorBorder(this.reports);
        } else {
          this.draw();
        }
      }.bind(this);
      window.addEventListener('resize', this.resizeHandler);
    },
    drawAddLayer: function (layerIndex) {
      var ctx = this.$refs.canvas.getContext('2d'),
        width = this.$refs.canvas.width,
        drawOptions = this.data.drawOptions;
      layerIndex = layerIndex || 0;
      this.drawRect(ctx, (width - drawOptions.interface.width) / 2,
        layerIndex * drawOptions.layerHeight + (drawOptions.layerHeight - drawOptions.interface.height) / 2,
        drawOptions.interface.width,
        drawOptions.interface.height,
        '#eee');
    },
    draw: function (notClearCanvas) {
      var ctx = this.$refs.canvas.getContext('2d'),
        width = this.$refs.canvas.width,
        height = this.$refs.canvas.height;
      ctx.beginPath();
      if (!notClearCanvas) {
        ctx.clearRect(0, 0, width, height);
      }
      if (this.data.layers.length === 0) {
        this.data.layers.push({
          type: LAYER_TYPE.INTERFACE,
          data: []
        });
      }
      this.data.layers.forEach(function (layer, index) {
        this.drawLayer(layer, index);
      }, this);
      this.data.layers.forEach(function (layer, index) {
        this.drawConnectionLine(layer, index);
      }, this);
      // 画完 layer 画 text 否则会被覆盖掉
      this.data.layers.forEach(function (layer, index) {
        this.drawLayerText(layer, index);
      }, this);
    },
    drawDiamond: function (ctx, x, y, xl, yl, style, isBorder) {
      ctx.moveTo(x, y - yl);
      ctx.lineTo(x + xl, y);
      ctx.lineTo(x, y + yl);
      ctx.lineTo(x - xl, y);
      ctx.closePath();
      if (isBorder) {
        ctx.strokeStyle = style;
        ctx.stroke();
      } else {
        ctx.fillStyle = style;
        ctx.fill();
      }
    },
    drawLine: function (ctx, x1, y1, x2, y2, strokeStyle, lineWidth) {
      strokeStyle = strokeStyle || '#eee';
      lineWidth = lineWidth || 2;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    },
    drawCircle: function (ctx, x, y, radius, fillStyle) {
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = fillStyle;
      ctx.fill();
    },
    drawRect: function (ctx, x, y, width, height, style, isBorder) {
      ctx.rect(x, y, width, height);
      if (isBorder) {
        ctx.strokeStyle = style;
        ctx.stroke();
      } else {
        ctx.fillStyle = style;
        ctx.fill();
      }
    },
    drawText: function (ctx, text, x, y) {
      ctx.font = this.data.drawOptions.text.font;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = this.data.drawOptions.text.fillStyle;
      ctx.fillText(text, x, y);
    },
    drawLayer: function (layer, index) {
      var ctx = this.$refs.canvas.getContext('2d'),
        width = this.$refs.canvas.width,
        drawOptions = this.data.drawOptions,
        y = index * drawOptions.layerHeight;
      switch (layer.type) {
        case LAYER_TYPE.INTERFACE:
          var deltaX = drawOptions.interface.width + drawOptions.interface.marginX * 2,
            deltaY = drawOptions.interface.height + drawOptions.interface.marginY * 2,
            startX = (width - layer.data.length * deltaX) / 2,
            startY = (drawOptions.layerHeight - deltaY) / 2;
          if (layer.data.length) {
            layer.data.forEach(function (interface, index) {
              var cx = startX + index * deltaX + drawOptions.interface.marginX,
                cy = y + startY + drawOptions.interface.marginY;
              this.drawRect(ctx, cx, cy, drawOptions.interface.width, drawOptions.interface.height, '#eee');
              interface._x = cx;
              interface._y = cy;
            }, this);
          } else {
            this.drawAddLayer(index);
          }
          break;
        case LAYER_TYPE.RULE:
          var cx = width / 2,
            cy = y + drawOptions.layerHeight / 2;
          layer._x = cx;
          layer._y = cy;
          this.drawDiamond(ctx, cx, cy, drawOptions.rule.xLength, drawOptions.rule.yLength, '#eee');
          break;
      }
    },
    drawConnectionLine: function (layer, index) {
      var ctx = this.$refs.canvas.getContext('2d'),
        drawOptions = this.data.drawOptions;
      if (index < this.data.layers.length - 1) {
        var nextLayer = this.data.layers[index + 1];
        switch (layer.type) {
          case LAYER_TYPE.INTERFACE:
            if (nextLayer.type === LAYER_TYPE.RULE) {
              layer.data.forEach(function (item) {
                var x = item._x + drawOptions.interface.width / 2,
                  y = item._y + drawOptions.interface.height;
                this.drawArrow(ctx, x, y, nextLayer._x, nextLayer._y - drawOptions.rule.yLength);
              }, this);
            }
            break;
          case LAYER_TYPE.RULE:
            if (nextLayer.type === LAYER_TYPE.INTERFACE) {
              var elem = nextLayer.data[nextLayer.fromRuleIndex];
              if (elem) {
                var x = elem._x + drawOptions.interface.width / 2,
                  y = elem._y;
                this.drawArrow(ctx, layer._x, layer._y + drawOptions.rule.yLength, x, y);
              }
            }
            break;
        }
      }
    },
    drawArrow: function (ctx, x1, y1, x2, y2, angle, arrowLength, strokeStyle, lineWidth) {
      var angle = angle || Math.PI / 6,
        arrowLength = arrowLength || 10,
        theta = Math.atan2(y2 - y1, x2 - x1),
        t_angle = theta - angle,
        dx = arrowLength * Math.cos(t_angle),
        dy = arrowLength * Math.sin(t_angle),
        a_x1 = x2 - dx,
        a_y1 = y2 - dy,
        t_angle = theta + angle,
        dx = arrowLength * Math.cos(t_angle),
        dy = arrowLength * Math.sin(t_angle),
        a_x2 = x2 - dx,
        a_y2 = y2 - dy;
      this.drawLine(ctx, a_x1, a_y1, x2, y2, strokeStyle, lineWidth);
      this.drawLine(ctx, a_x2, a_y2, x2, y2, strokeStyle, lineWidth);
      this.drawLine(ctx, x1, y1, x2, y2, strokeStyle, lineWidth);
    },
    drawLayerText: function (layer, index) {
      var ctx = this.$refs.canvas.getContext('2d'),
        width = this.$refs.canvas.width,
        drawOptions = this.data.drawOptions;
      ctx.font = drawOptions.text.font;
      switch (layer.type) {
        case LAYER_TYPE.INTERFACE:
          if (layer.data.length) {
            layer.data.forEach(function (interface) {
              var index;
              for (index = 0; index < interface.name.length; index++) {
                var width = ctx.measureText(interface.name.slice(0, index)).width;
                if (width > 140) {
                  break;
                }
              }
              var displayData = interface.name.slice(0, index) + (index < interface.name.length ? '...' : '');
              this.drawText(ctx, displayData, interface._x + drawOptions.interface.width / 2, interface._y + drawOptions.interface.height / 2);
            }, this);
          } else {
            this.drawText(ctx, '+', width / 2, index * drawOptions.layerHeight + drawOptions.layerHeight / 2);
          }
          break;
        case LAYER_TYPE.RULE:
          var index;
          for (index = 0; index < layer.data.length; index++) {
            var width = ctx.measureText(layer.data.slice(0, index)).width;
            if (width > 90) {
              break;
            }
          }
          var displayData = layer.data.slice(0, index) + (index < layer.data.length ? '...' : '');
          this.drawText(ctx, displayData, layer._x, layer._y);
          break;
      }
    },
    handleCanvasMove: function (evt) {
      var x = evt.event.clientX - this.$refs.canvas.getBoundingClientRect().left;
      var y = evt.event.clientY - this.$refs.canvas.getBoundingClientRect().top;
      var elem = this.getElement(x, y);
      var layer = this.getLayerElement(x, y);
      clearTimeout(this.data.timeout);
      if (elem) {
        if (elem.type !== 'add') {
          this.data.hoverElem = elem;
        }
        this.$refs.canvas.style.cursor = 'pointer';
      } else {
        this.data.timeout = setTimeout(function () {
          this.data.hoverElem = null;
          this.$update();
        }.bind(this), 500);
        this.$refs.canvas.style.cursor = 'default';
      }
      if (layer) {
        this.data.hoverLayer = layer;
      } else {
        this.data.hoverLayer = null;
      }
    },
    handleCanvasClick: function (evt) {
      var x = evt.event.clientX - this.$refs.canvas.getBoundingClientRect().left;
      var y = evt.event.clientY - this.$refs.canvas.getBoundingClientRect().top;
      var elem = this.getElement(x, y);
      if (elem) {
        if (elem.type === 'add') {
          this.addInterface(elem.layer);
        } else {
          if (elem.layer.type === LAYER_TYPE.RULE) {
            this.editRule(elem.layer);
          } else {
            // 跳转链接
            this.dispatchTo(elem);
          }
        }
      }
    },
    getElement: function (x, y) {
      var drawOptions = this.data.drawOptions,
        layerIndex = Math.floor(y / drawOptions.layerHeight),
        layer = this.data.layers[layerIndex],
        ctx = this.$refs.canvas.getContext('2d'),
        width = this.$refs.canvas.width;
      if (layer) {
        switch (layer.type) {
          case LAYER_TYPE.INTERFACE:
            var interfaces = layer.data,
              marginX = drawOptions.interface.marginX,
              marginY = drawOptions.interface.marginY,
              deltaX = drawOptions.interface.width + marginX * 2,
              deltaY = drawOptions.interface.height + marginY * 2,
              startX = (width - (interfaces.length || 1) * deltaX) / 2,
              startY = layerIndex * drawOptions.layerHeight + (drawOptions.layerHeight - deltaY) / 2,
              endX = startX + (interfaces.length || 1) * deltaX,
              endY = startY + deltaY;
            if ((startX + marginX < x) && (x < endX - marginX) && (startY + marginY <= y) && (y <= endY - marginY)) {
              var index = Math.floor((x - startX) / deltaX),
                ex = startX + index * deltaX + deltaX - marginX;
              if (x <= ex) {
                if (interfaces[index]) {
                  return {
                    layer: layer,
                    elem: interfaces[index],
                    x: ex,
                    y: layerIndex * drawOptions.layerHeight - 35
                  };
                } else {
                  // 否则是新增节点
                  return {
                    type: 'add',
                    layer: layer,
                    x: ex,
                    y: layerIndex * drawOptions.layerHeight
                  };
                }
              }
            }
            break;
          case LAYER_TYPE.RULE:
            return {
              layer: layer,
              x: width / 2 + drawOptions.rule.xLength,
              y: layerIndex * drawOptions.layerHeight + drawOptions.layerHeight / 2 - 15
            };
        }
      }
    },
    getLayerElement: function (x, y) {
      var drawOptions = this.data.drawOptions,
        layerIndex = Math.floor(y / drawOptions.layerHeight),
        layer = this.data.layers[layerIndex];
      if (layer) {
        return {
          layer: layer,
          y: layerIndex * drawOptions.layerHeight + drawOptions.layerHeight / 2 - 15
        };
      }
    },
    addInterface: function (layer, interface) {
      var layerIndex = this.data.layers.indexOf(layer);
      if (interface) {
        var index = layer.data.indexOf(interface);
        this.$emit('show-interface-modal', {
          data: JSON.parse(JSON.stringify(this.data.layers)),
          layerIndex: layerIndex,
          index: index,
          callback: function (interfaces) {
            interfaces.forEach(function (item) {
              layer.data.splice(index + 1, 0, item);
            }, this);
            this.copyLayerList();
            this.draw();
            this.$update();
          }.bind(this)
        });
      } else {
        // 新增单个节点
        this.$emit('show-interface-modal', {
          data: JSON.parse(JSON.stringify(this.data.layers)),
          layerIndex: layerIndex,
          fromRuleIndex: layerIndex > 0 && layer.fromRuleIndex ? 0 : undefined,
          callback: function (interfaces) {
            interfaces.forEach(function (item) {
              layer.data.push(item);
            }, this);
            if (layerIndex > 0) {
              if (layer.fromRuleIndex != null) {
                // 第一个自动成为转换规则输出接口
                layer.fromRuleIndex = 0;
              }
            }
            this.copyLayerList();
            this.draw();
            this.$update();
          }.bind(this)
        });
      }
    },
    deleteInterface: function (layer, interface) {
      var layerIndex = this.data.layers.indexOf(layer);
      var index = layer.data.indexOf(interface);
      this.$emit('delete-interface', {
        data: JSON.parse(JSON.stringify(this.data.layers)),
        layerIndex: layerIndex,
        index: index,
        fromRuleIndex: layerIndex > 0 && layer.data.length && (layer.fromRuleIndex === index) ? 0 : layer.fromRuleIndex,
        callback: function () {
          layer.data.splice(index, 1);
          if (layerIndex > 0) {
            if (layer.data.length) {
              if (layer.fromRuleIndex === index) {
                // 第一个自动成为转换规则输出接口
                layer.fromRuleIndex = 0;
              }
            } else {
              layer.fromRuleIndex = null;
            }
          }
          this.draw();
          this.$update();
        }.bind(this)
      });
    },
    deleteLayer: function (layer) {
      if (this.data.layers.length === 1) {
        notify.show('不能再删除了！', 'error', 3000);
        return;
      }
      var layerIndex = this.data.layers.indexOf(layer);
      this.$emit('delete-layer', {
        data: JSON.parse(JSON.stringify(this.data.layers)),
        layerIndex: layerIndex,
        callback: function () {
          this.data.layers.splice(layerIndex, 1);
          this.data.layers[0].fromRuleIndex = null;
          this.draw();
          this.$update();
        }.bind(this)
      });
    },
    addRule: function (layer, interface) {
      var index = this.data.layers.indexOf(layer);
      if (index + 1 === this.data.layers.length) {
        this.$emit('add-rule', {
          data: JSON.parse(JSON.stringify(this.data.layers)),
          layerIndex: index + 1,
          callback: function () {
            this.data.layers.splice(index + 1, 0, {
              type: LAYER_TYPE.RULE,
              data: ''
            });
            this.draw();
            this.$update();
          }.bind(this)
        });
      }
    },
    selectBind: function (layer, interface) {
      var index;
      for (index = 0; index < layer.data.length; index++) {
        if (layer.data[index].id === interface.id) {
          break;
        }
      }
      var layerIndex = this.data.layers.indexOf(layer);
      this.$emit('select-to-receive', {
        data: JSON.parse(JSON.stringify(this.data.layers)),
        layerIndex: layerIndex,
        fromRuleIndex: index,
        callback: function () {
          layer.fromRuleIndex = index;
          this.draw();
          this.$update();
        }.bind(this)
      });
    },
    editRule: function (layer) {
      var layerIndex = this.data.layers.indexOf(layer);
      if (layer.type === LAYER_TYPE.RULE) {
        this.$emit('show-edit-rule', {
          value: layer.data,
          data: JSON.parse(JSON.stringify(this.data.layers)),
          layerIndex: layerIndex,
          callback: function (data) {
            layer.data = data;
            this.draw();
          }.bind(this)
        });
      }
    },
    toInterface: function (layer) {
      var index = this.data.layers.indexOf(layer);
      if (index + 1 === this.data.layers.length) {
        this.data.layers.splice(index + 1, 0, {
          type: LAYER_TYPE.INTERFACE,
          data: []
        });
        this.$emit('show-interface-modal', {
          data: JSON.parse(JSON.stringify(this.data.layers)),
          layerIndex: index + 1,
          fromRuleIndex: 0,
          callback: function (interfaces) {
            interfaces.forEach(function (item) {
              this.data.layers[index + 1].data.push(item);
            }, this);
            this.copyLayerList();
            this.data.layers[index + 1].fromRuleIndex = 0;
            this.draw();
            this.$update();
          }.bind(this)
        });
      } else {
        if (this.data.layers[index + 1].type === LAYER_TYPE.INTERFACE) {
          var interfaces = this.data.layers[index + 1].data;
          var toInf = interfaces[this.data.layers[index + 1].fromRuleIndex];
          if (!toInf) {
            this.$emit('show-interface-modal', {
              data: JSON.parse(JSON.stringify(this.data.layers)),
              layerIndex: index + 1,
              fromRuleIndex: 0,
              callback: function (infs) {
                infs.forEach(function (item) {
                  interfaces.push(item);
                }, this);
                this.copyLayerList();
                this.data.layers[index + 1].fromRuleIndex = 0;
                this.draw();
                this.$update();
              }.bind(this)
            });
          }
        }
      }
    },
    dispatchTo: function (elem) {
      // dispatchTo elem's link
      dispatcher._$redirect('/interface/detail/?pid=' + elem.elem.projectId + '&id=' + elem.elem.id);
    },
    viewTestcases: function (layer, elem) {
      this.$emit('view-testcases', {
        interface: elem,
        callback: function () {

        }
      });
    },
    setData: function (layers) {
      this.data.layers = layers;
      this.draw();
      this.$update();
    },
    reset: function () {
      this.setData([{
        type: LAYER_TYPE.INTERFACE,
        data: []
      }]);
      this.draw();
      this.$update();
    },
    setErrorBorder: function (reports, borderWidth, style) {
      this.reports = reports;
      var ctx = this.$refs.canvas.getContext('2d'),
        drawOptions = this.data.drawOptions;
      borderWidth = borderWidth || 3,
        style = style || '#f04c62';
      this.draw();
      ctx.beginPath();
      reports.forEach(function (report) {
        if (report.status === 0) {
          if (report.type === 'RUN_INTERFACE') {
            var inf;
            var layer = this.data.layers.find(function (layer) {
              if (layer.type === LAYER_TYPE.INTERFACE) {
                var t = layer.data.find(function (i) {
                  return i.id === report.testcase.iid;
                });
                if (t) {
                  inf = t;
                }
                return t != null;
              }
            });
            if (inf) {
              this.drawRect(ctx, inf._x - borderWidth, inf._y - borderWidth, drawOptions.interface.width + 2 * borderWidth, drawOptions.interface.height + 2 * borderWidth, style, true);
            }
          } else {
            var layer = this.data.layers[report.index];
            if (layer) {
              this.drawDiamond(ctx, layer._x, layer._y, drawOptions.rule.xLength + borderWidth * drawOptions.rule.xLength / drawOptions.rule.yLength, drawOptions.rule.yLength + borderWidth, style, true);
            }
          }
        }
      }, this);
    },
    copyLayerList: function () {
      this.data.layers = JSON.parse(JSON.stringify(this.data.layers));
    },
    getLayers: function () {
      return this.data.layers;
    },
    destroy: function () {
      this.supr();
      window.removeEventListener('resize', this.resizeHandler);
    }
  });

  return DependencyTestPanel;
});
