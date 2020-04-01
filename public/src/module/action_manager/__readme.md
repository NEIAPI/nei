# action manager 介绍

action manager 会监听三类元素的事件, 首先元素需要有 data-action 属性, 它的值是必须是一个合法的 json:

* data-action='{"type": "modify"}', 表示该值可以修改, 并有统一的 hover 效果, 具体参数见代码注释

* data-action='{"type": "del"}', 表示该值可以删除, 具体参数见代码注释

* data-action='{"event": "[自定义事件名]"}', 表示需要触发该事件, 事件在 window 对象上触发, 所以事先需要在 window 对象上绑定相应的事件

action manager 会按以上顺序从上往下判断, 如果不匹配, 则不做任何动作
