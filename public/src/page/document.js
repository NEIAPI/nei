/**
 * app 启动
 */
NEJ.define([
  'util/dispatcher/dispatcher',
  'base/event',
  'base/element',
  'pro/cache/doc_cache'
], function (dsp, v, e, cache) {

  function getQueryString(name) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
  }

  var cache = cache._$$CacheDoc._$allocate({});
  var proId = getQueryString('id');
  cache._$getDocInfo(proId).then(function (res) {

    history.auto = true;
    // 开始处理 UMI
    dsp._$startup({
      rules: {
        'rewrite': {
          '404': '/m/doc/default/',
        },
        'alias': {
          'layout-system': '/m',
          'layout-doc': '/m/doc',
          'layout-doc-menu': '/?/doc/menu/',
          'layout-doc-default': '/m/doc/default/',
          'layout-doc-interfaces': '/m/doc/interfaces/',
          'layout-doc-rpcs': '/m/doc/rpcs/',
          'layout-doc-datatypes': '/m/doc/datatypes/',
          'layout-doc-constraints': '/m/doc/constraints/',
          'layout-doc-pages': '/m/doc/pages/',
          'layout-doc-templates': '/m/doc/templates/',
          'layout-doc-members': '/m/doc/members/',
          'layout-doc-custom': '/m/doc/custom/',
          'layout-doc-all': '/m/doc/all/'
        }
      },
      modules: {
        '/m': {
          'module': 'layout/doc/system.html',
        },
        '/m/doc': {
          'module': 'layout/doc/doc.html',
          'composite': {
            'tab': '/?/doc/menu/'
          }
        },
        '/?/doc/menu/': {
          'module': 'layout/doc/doc_menu/doc_menu.html'
        },
        '/m/doc/interfaces/': {
          'module': 'layout/doc/doc_interface/doc_interface.html'
        },
        '/m/doc/rpcs/': {
          'module': 'layout/doc/doc_rpc/doc_rpc.html'
        },
        '/m/doc/datatypes/': {
          'module': 'layout/doc/doc_datatype/doc_datatype.html'
        },
        '/m/doc/constraints/': {
          'module': 'layout/doc/doc_constraint/doc_constraint.html'
        },
        '/m/doc/pages/': {
          'module': 'layout/doc/doc_page/doc_page.html'
        },
        '/m/doc/templates/': {
          'module': 'layout/doc/doc_template/doc_template.html'
        },
        '/m/doc/members/': {
          'module': 'layout/doc/doc_member/doc_member.html'
        },
        '/m/doc/default/': {
          'module': 'layout/doc/doc_default/doc_default.html'
        },
        '/m/doc/custom/': {
          'module': 'layout/doc/doc_custom/doc_custom.html'
        },
        '/m/doc/all/': {
          'module': 'layout/doc/doc_all/doc_all.html'
        }
      },
      onbeforechange: function (options) {
        var umi = options.path;
        if (umi.substr(-1) !== '/') {
          umi += '/';
        }

        //设置默认首页，默认为项目文档
        if (umi && umi.indexOf('/?') === -1 && umi.indexOf('/m') !== 0) {
          switch (umi) {
            case '/doc/':
              umi += 'default/';
              break;
            default:
              break;
          }
          options.path = '/m' + umi;
        }
      }
    });
  });


  // 处理不用跳转的超链接, 只改变 url 即可
  v._$addEvent(document, 'click', function (evt) {
    var target = v._$getElement(evt, 'c:stateful');
    if (target && target.tagName === 'A') {
      v._$stop(evt);
      dispatcher._$redirect(target.href);
    }
  });
  // 给 html 标签加个类名, pc 上需要重置滚动条样式
  if (navigator.userAgent.indexOf('Windows NT') !== -1) {
    e._$addClassName(document.documentElement, 'os-pc');
  }

});
