/**
 * umi 配置文件
 */
NEJ.define([], function (p) {
  p._$rules = {
    'rewrite': {
      '404': '/m/dashboard/',
      '/m/progroup/p/res/$1': /^\/m\/((interface|rpc|template|datatype|group|constraint|word|client)\/.*)$/,
      '/m/progroup/p/page/$1': /^\/m\/page\/(.*)$/,
      '/m/progroup/p/$1': /^\/m\/project\/(.*)$/,
      '/m/progroup/search/$1': /^\/m\/search\/(.*)$/
    },
    'title': {
      '/m/dashboard/': 'NEI - 接口管理平台',
      '/m/setting': '设置',
      '/m/setting/profile/': '基本资料 - 接口管理平台',
      '/m/setting/personal-access-token/': '基本资料 - 访问令牌',
      '/m/setting/notification/': '通知设置 - 接口管理平台',
      '/m/setting/cache/': '缓存设置 - 接口管理平台',
      '/m/spec/': '规范管理 - 接口管理平台',
      '/m/spec/home/': '规范管理 - 接口管理平台',
      '/m/spec/discover/': '发现规范 - 接口管理平台',
      '/m/spec/create/': '新建规范 - 接口管理平台',
      '/m/spec/list/': '规范列表 - 接口管理平台',
      '/m/spec/ref/': '规范引用 - 接口管理平台',

      '/m/progroup/': '项目管理',
      '/m/progroup/search/group/': '搜索项目组 - 接口管理平台',
      '/m/progroup/search/project/': '搜索项目 - 接口管理平台',
      '/m/progroup/home/activity/': '动态 - 接口管理平台',
      '/m/progroup/home/management/': '管理 - 接口管理平台',
      '/m/progroup/detail/activity/': '项目组动态 - 接口管理平台',
      '/m/progroup/detail/projectmanage/': '项目管理 - 接口管理平台',
      '/m/progroup/detail/project/': '项目 - 接口管理平台',
      '/m/progroup/detail/teammanage/': '团队管理 - 接口管理平台',
      '/m/progroup/detail/team/': '团队 - 接口管理平台',
      '/m/progroup/detail/privilege/': '权限管理 - 接口管理平台',
      '/m/progroup/detail/tool/': '设置 - 接口管理平台',
      '/m/progroup/p/detail/': '基本信息 - 接口管理平台',
      '/m/progroup/p/page/': '页面 - 接口管理平台',
      '/m/progroup/p/res/': '资源 - 接口管理平台',
      '/m/progroup/p/page/detail/': '页面 - 接口管理平台',
      '/m/progroup/p/page/create/': '创建页面 - 接口管理平台',
      '/m/progroup/p/tool/': '工具 - 接口管理平台',
      '/m/progroup/p/activity/': '动态 - 接口管理平台',
      '/m/progroup/p/res/interface/': 'HTTP 接口 - 接口管理平台',
      '/m/progroup/p/res/interface/ref/': '接口引用 - 接口管理平台',
      '/m/progroup/p/res/interface/create/': '新建 - 接口管理平台',
      '/m/progroup/p/res/interface/detail/': '接口详情 - 接口管理平台',
      '/m/progroup/p/res/interface/detail/req/': '请求参数 - 接口管理平台',
      '/m/progroup/p/res/interface/detail/res/': '响应结果 - 接口管理平台',
      '/m/progroup/p/res/interface/detail/mockstore/': 'MockStore - 接口管理平台',
      '/m/progroup/p/res/interface/detail/version/': '版本列表 - 接口管理平台',
      '/m/progroup/p/res/interface/detail/statistics/': '使用统计 - 接口管理平台',
      '/m/progroup/p/res/interface/detail/activity/': '历史操作 - 接口管理平台',
      '/m/progroup/p/res/rpc/': 'RPC 接口 - 接口管理平台',
      '/m/progroup/p/res/rpc/create/': '新建 RPC 接口 - 接口管理平台',
      '/m/progroup/p/res/rpc/detail/': '接口详情 - 接口管理平台',
      '/m/progroup/p/res/rpc/detail/req/': '请求参数 - 接口管理平台',
      '/m/progroup/p/res/rpc/detail/res/': '响应结果 - 接口管理平台',
      '/m/progroup/p/res/rpc/detail/version/': '版本列表 - 接口管理平台',
      '/m/progroup/p/res/rpc/detail/activity/': '历史操作 - 接口管理平台',
      '/m/progroup/p/res/template/': '页面模板 - 接口管理平台',
      '/m/progroup/p/res/template/create/': '创建模板 - 接口管理平台',
      '/m/progroup/p/res/template/detail/': '模板详情 - 接口管理平台',
      '/m/progroup/p/res/template/ref/': '模板引用 - 接口管理平台',
      '/m/progroup/p/res/datatype/': '数据模型 - 接口管理平台',
      '/m/progroup/p/res/datatype/create/': '新建数据模型 - 接口管理平台',
      '/m/progroup/p/res/datatype/detail/': '数据模型详情 - 接口管理平台',
      '/m/progroup/p/res/datatype/detail/attribute/': '数据模型详情 - 接口管理平台',
      '/m/progroup/p/res/datatype/detail/version/': '数据模型详情 - 接口管理平台',
      '/m/progroup/p/res/datatype/detail/activity/': '数据模型详情 - 接口管理平台',
      '/m/progroup/p/res/datatype/ref/': '数据模型引用 - 接口管理平台',
      '/m/progroup/p/res/constraint/': '规则函数 - 接口管理平台',
      '/m/progroup/p/res/constraint/create/': '新建规则函数 - 接口管理平台',
      '/m/progroup/p/res/constraint/detail/': '规则详情 - 接口管理平台',
      '/m/progroup/p/res/word/': '参数字典 - 接口管理平台',
      '/m/progroup/p/res/word/create/': '新建参数字典 - 接口管理平台',
      '/m/progroup/p/res/word/detail/': '词条详情 - 接口管理平台',
      '/m/progroup/p/res/group/': '业务分组 - 接口管理平台',
      '/m/progroup/p/res/group/create/': '新建分组 - 接口管理平台',
      '/m/progroup/p/res/group/detail/': '分组详情 - 接口管理平台',
      '/m/progroup/p/res/group/ref/': '分组引用 - 接口管理平台',
      '/m/progroup/p/res/client/': '客户端 - 接口管理平台',
      '/m/progroup/p/res/client/create/': '新建客户端 - 接口管理平台',
      '/m/progroup/p/res/client/detail/': '客户端详情 - 接口管理平台',
      '/m/progroup/p/res/client/ref/': '客户端引用 - 接口管理平台',


      '/m/test/group/create/': '创建用例 - 接口测试',
      '/m/test/group/case/': '用例管理 - 接口测试',
      '/m/test/group/report/': '测试报告 - 接口测试',
      '/m/test/group/suite/': '测试集 - 接口测试',
      '/m/test/group/dependency/': '依赖测试集 - 接口测试',

      '/m/notification/': '消息中心',
      '/m/notification/system/': '系统消息 - 消息中心',
      '/m/notification/personal/': '个人消息 - 消息中心',
      '/m/notification/api/': '接口变更消息 - 消息中心',
      '/m/notification/audit/': '审核记录 - 消息中心',

      '/m/globalsearch/interfaces/': 'HTTP 接口搜索 - 接口管理平台',
      '/m/globalsearch/datatypes/': '数据模型搜索 - 接口管理平台',
      '/m/globalsearch/rpcs/': 'RPC 接口搜索 - 接口管理平台',
      '/m/globalsearch/constraints/': '规则函数搜索 - 接口管理平台',
      '/m/globalsearch/words/': '参数字典搜索 - 接口管理平台',
      '/m/globalsearch/pages/': '页面搜索 - 接口管理平台',
      '/m/globalsearch/templates/': '页面模板搜索 - 接口管理平台',
      '/m/globalsearch/groups/': '业务分组搜索 - 接口管理平台',
      '/m/globalsearch/projects/': '项目搜索 - 接口管理平台',
      '/m/globalsearch/progroups/': '项目组搜索 - 接口管理平台',
    },
    'alias': {
      'system-tab': '/?/system/tab/',

      'setting-tab': '/?/setting/tab/',

      'spec-tab': '/?/spec/tab/',
      'spec-detail-tab': '?/spec/detail/tab/',

      'progroup-tree': '?/progroup/tree/',
      'progroup-home-tab': '/?/progroup/home/tab/',
      'progroup-applylist': '/?/progroup/applylist/',
      'progroup-search-tab': '/?/progroup/search/tab/',
      'progroup-detail-tab': '/?/progroup/detail/tab/',
      'progroup-p-tab': '/?/progroup/p/tab/',
      'res-tab': '/?/res/tab/',
      'res-interface-detail-tab': '/?/res/interface/detail/tab/',
      'res-rpc-detail-tab': '/?/res/rpc/detail/tab/',
      'res-datatype-detail-tab': '/?/res/datatype/detail/tab/',

      'test-tab': '/?/test/tab/',
      'test-main-tab': '/?/test/main/tab/',
      'test-main-tab-tab': '/?/test/main/tab/tab/',

      'notification-tab': '/?/notification/tab/',

      'layout-system': '/m',
      'layout-dashboard': '/m/dashboard/',
      'layout-globalsearch-input': '/?/m/global_search/search_input/',
      'layout-globalsearch-tab': '/?/m/global_search/search_result_tab/',
      'layout-spec': '/m/spec',
      'layout-progroup': '/m/progroup',
      'layout-test': '/m/test',
      'layout-setting': '/m/setting',
      'layout-notification': '/m/notification',

      'setting-profile': '/m/setting/profile/',
      'setting-personal-access-token': '/m/setting/personal-access-token/',
      'setting-notification': '/m/setting/notification/',
      'setting-cache': '/m/setting/cache/',

      'spec-home': '/m/spec/home/',
      'spec-discover': '/m/spec/discover/',
      'spec-create': '/m/spec/create/',
      'spec-list': '/m/spec/list/',
      'spec-ref': '/m/spec/ref/',
      'spec-detail': '/m/spec/detail',
      'spec-detail-doc': '/m/spec/detail/doc/',
      'spec-detail-template': '/m/spec/detail/template/',
      'spec-detail-setting': '/m/spec/detail/setting/',
      'spec-detail-history': '/m/spec/detail/history/',

      'progroup-home': '/m/progroup/home',
      'progroup-activity': '/m/progroup/home/activity/',
      'progroup-management': '/m/progroup/home/management/',

      'progroup-search': '/m/progroup/search',
      'progroup-searchresult': [
        '/m/progroup/search/group/',
        '/m/progroup/search/project/'
      ],

      'progroup-detail': '/m/progroup/detail',
      'progroup-detail-a': '/m/progroup/detail/activity/',
      'progroup-detail-p': '/m/progroup/detail/project/',
      'progroup-detail-pm': '/m/progroup/detail/projectmanage/',
      'progroup-detail-pr': '/m/progroup/detail/privilege/',
      'progroup-detail-t': '/m/progroup/detail/team/',
      'progroup-detail-tl': '/m/progroup/detail/tool/',
      'progroup-detail-tm': '/m/progroup/detail/teammanage/',

      'progroup-p': '/m/progroup/p',
      'progroup-p-detail': '/m/progroup/p/detail/',
      'progroup-p-page': '/m/progroup/p/page/',
      'progroup-p-page-detail': '/m/progroup/p/page/detail/',
      'progroup-p-page-create': '/m/progroup/p/page/create/',
      'progroup-p-res': '/m/progroup/p/res',
      'progroup-p-tool': '/m/progroup/p/tool/',
      'progroup-p-activity': '/m/progroup/p/activity/',

      'test-record': '/m/test/record',
      'test-group': '/m/test/group',
      'test-create': [
        '/m/test/record/create/',
        '/m/test/group/create/',
      ],
      'test-report': [
        '/m/test/record/report/',
        '/m/test/group/report/',
      ],
      'test-case': [
        '/m/test/group/case/',
      ],
      'test-case-detail': [
        '/m/test/group/case/detail/',
      ],
      'test-suite-list': [
        '/m/test/group/suite/'
      ],
      'test-dependency': [
        '/m/test/group/dependency/'
      ],

      'res-interface': '/m/progroup/p/res/interface/',
      'res-interface-create': [
        '/m/progroup/p/res/interface/create/',
        '/?/progroup/p/res/interface/create/'
      ],
      'res-interface-ref': '/m/progroup/p/res/interface/ref/',
      'res-interface-detail': '/m/progroup/p/res/interface/detail',

      'res-rpc': '/m/progroup/p/res/rpc/',
      'res-rpc-create': [
        '/m/progroup/p/res/rpc/create/',
        '/?/progroup/p/res/rpc/create/'
      ],
      'res-rpc-detail': '/m/progroup/p/res/rpc/detail',

      'res-template': '/m/progroup/p/res/template/',
      'res-template-create': [
        '/m/progroup/p/res/template/create/',
        '/?/progroup/p/res/template/create/'
      ],
      'res-template-detail': '/m/progroup/p/res/template/detail/',
      'res-template-ref': '/m/progroup/p/res/template/ref/',

      'res-datatype': '/m/progroup/p/res/datatype/',
      'res-datatype-create': [
        '/m/progroup/p/res/datatype/create/',
        '/?/progroup/p/res/datatype/create/'
      ],
      'res-datatype-ref': '/m/progroup/p/res/datatype/ref/',
      'res-datatype-detail': '/m/progroup/p/res/datatype/detail',

      'res-constraint': [
        '/m/progroup/p/res/constraint/',
        '/m/test/record/constraint/'
      ],
      'res-constraint-create': [
        '/m/progroup/p/res/constraint/create/',
        '/?/progroup/p/res/constraint/create/',
        '/m/test/record/constraint/create/'
      ],
      'res-constraint-detail': [
        '/m/progroup/p/res/constraint/detail/',
        '/m/test/record/constraint/detail/'
      ],

      'res-word': [
        '/m/progroup/p/res/word/',
        '/m/test/record/word/'
      ],
      'res-word-create': [
        '/m/progroup/p/res/word/create/',
        '/?/progroup/p/res/word/create/',
        '/m/test/record/word/create/'
      ],
      'res-word-detail': [
        '/m/progroup/p/res/word/detail/',
        '/m/test/record/word/detail/'
      ],

      'res-group': '/m/progroup/p/res/group/',
      'res-group-create': [
        '/m/progroup/p/res/group/create/',
        '/?/progroup/p/res/group/create/'
      ],
      'res-group-detail': '/m/progroup/p/res/group/detail/',
      'res-group-ref': '/m/progroup/p/res/group/ref/',

      'res-client': '/m/progroup/p/res/client/',
      'res-client-create': [
        '/m/progroup/p/res/client/create/',
        '/?/progroup/p/res/client/create/'
      ],
      'res-client-detail': '/m/progroup/p/res/client/detail/',
      'res-client-ref': '/m/progroup/p/res/client/ref/',

      'interface-detail-req': '/m/progroup/p/res/interface/detail/req/',
      'interface-detail-res': '/m/progroup/p/res/interface/detail/res/',
      'interface-detail-mockstore': '/m/progroup/p/res/interface/detail/mockstore/',
      'interface-detail-version': '/m/progroup/p/res/interface/detail/version/',
      'interface-detail-statistics': '/m/progroup/p/res/interface/detail/statistics/',
      'interface-detail-activity': '/m/progroup/p/res/interface/detail/activity/',

      'rpc-detail-req': '/m/progroup/p/res/rpc/detail/req/',
      'rpc-detail-res': '/m/progroup/p/res/rpc/detail/res/',
      'rpc-detail-version': '/m/progroup/p/res/rpc/detail/version/',
      'rpc-detail-activity': '/m/progroup/p/res/rpc/detail/activity/',

      'datatype-detail-attribute': '/m/progroup/p/res/datatype/detail/attribute/',
      'datatype-detail-version': '/m/progroup/p/res/datatype/detail/version/',
      'datatype-detail-activity': '/m/progroup/p/res/datatype/detail/activity/',

      'notification-system': '/m/notification/system/',
      'notification-personal': '/m/notification/personal/',
      'notification-api': '/m/notification/api/',
      'notification-audit': '/m/notification/audit/',

      'globalsearch-result': [
        '/m/globalsearch/interfaces/',
        '/m/globalsearch/rpcs/',
        '/m/globalsearch/datatypes/',
        '/m/globalsearch/constraints/',
        '/m/globalsearch/words/',
        '/m/globalsearch/pages/',
        '/m/globalsearch/templates/',
        '/m/globalsearch/groups/',
        '/m/globalsearch/projects/',
        '/m/globalsearch/progroups/',
      ]
    }
  };

  p._$modules = {
    '/?/system/tab/': 'layout/system_tab/system_tab.html',

    '/?/setting/tab/': 'layout/setting_tab/setting_tab.html',

    '/?/spec/tab/': 'layout/spec_tab/spec_tab.html',
    '/?/spec/detail/tab/': 'layout/spec_s/spec_detail_tab/spec_detail_tab.html',

    '/?/progroup/tree/': 'layout/progroup_tree/progroup_tree.html',
    '/?/progroup/home/tab/': 'layout/progroup_home_tab/progroup_home_tab.html',
    '/?/progroup/applylist/': 'layout/progroup_home_tab_s/progroup_applylist/progroup_applylist.html',
    '/?/progroup/search/tab/': 'layout/progroup_search_tab/progroup_search_tab.html',
    '/?/progroup/detail/tab/': 'layout/progroup_detail_tab/progroup_detail_tab.html',
    '/?/progroup/p/tab/': 'layout/progroup_p_tab/progroup_p_tab.html',

    '/?/res/tab/': 'layout/res_tab/res_tab.html',
    '/?/res/interface/detail/tab/': 'layout/res_interface_detail_tab/res_interface_detail_tab.html',
    '/?/res/rpc/detail/tab/': 'layout/res_rpc_detail_tab/res_rpc_detail_tab.html',
    '/?/res/datatype/detail/tab/': 'layout/res_datatype_detail_tab/res_datatype_detail_tab.html',

    '/?/notification/tab/': 'layout/notification_tab/notification_tab.html',

    // 资源创建的私有模块
    '/?/progroup/p/res/interface/create/': {
      'module': 'layout/res_tab_s/res_interface_create/res_interface_create.html',
      'config': {
        'private': true
      }
    },
    // 资源创建的私有模块
    '/?/progroup/p/res/rpc/create/': {
      'module': 'layout/res_tab_s/res_rpc_create/res_rpc_create.html',
      'config': {
        'private': true
      }
    },
    '/?/progroup/p/res/datatype/create/': {
      'module': 'layout/res_tab_s/res_datatype_create/res_datatype_create.html',
      'config': {
        'private': true
      }
    },
    '/?/progroup/p/res/template/create/': {
      'module': 'layout/res_tab_s/res_template_create/res_template_create.html',
      'config': {
        'private': true
      }
    },
    '/?/progroup/p/res/constraint/create/': {
      'module': 'layout/res_tab_s/res_constraint_create/res_constraint_create.html',
      'config': {
        'private': true
      }
    },
    '/?/progroup/p/res/word/create/': {
      'module': 'layout/res_tab_s/res_word_create/res_word_create.html',
      'config': {
        'private': true
      }
    },
    '/?/progroup/p/res/group/create/': {
      'module': 'layout/res_tab_s/res_group_create/res_group_create.html',
      'config': {
        'private': true
      }
    },

    '/?/progroup/p/res/client/create/': {
      'module': 'layout/res_tab_s/res_client_create/res_client_create.html',
      'config': {
        'private': true
      }
    },

    '/?/test/tab/': 'layout/test_tab/test_tab.html',
    '/?/test/main/tab/': 'layout/test_main_tab/test_main_tab.html',
    '/?/test/main/tab/tab/': 'layout/test_main_tab_tab/test_main_tab_tab.html',
    '/?/m/global_search/search_input/': 'layout/global_search/search_input/input.html',
    '/?/m/global_search/search_result_tab/': 'layout/global_search/search_result_tab/result_tab.html',

    '/m': {
      'module': 'layout/system/system.html',
      'composite': {
        'tab': '/?/system/tab/'
      }
    },
    '/m/dashboard/': {
      'module': 'layout/dashboard/dashboard.html',
      'composite': {
        'search': '/?/m/global_search/search_input/'
      }
    },
    '/m/setting': {
      'module': 'layout/setting/setting.html',
      'composite': {
        'tab': '/?/setting/tab/'
      }
    },
    '/m/setting/profile/': 'layout/setting_tab_s/setting_profile/setting_profile.html',
    '/m/setting/personal-access-token/': 'layout/setting_tab_s/setting_pat/setting_pat.html',
    '/m/setting/notification/': 'layout/setting_tab_s/setting_notification/setting_notification.html',
    '/m/setting/cache/': 'layout/setting_tab_s/setting_cache/setting_cache.html',

    '/m/spec': {
      'module': 'layout/spec/spec.html',
      'composite': {
        'tab': '/?/spec/tab/'
      }
    },
    '/m/spec/home/': 'layout/spec_s/spec_home/spec_home.html',
    '/m/spec/discover/': 'layout/spec_s/spec_discover/spec_discover.html',
    '/m/spec/create/': 'layout/spec_s/spec_create/spec_create.html',
    '/m/spec/list/': 'layout/spec_s/spec_list/spec_list.html',
    '/m/spec/ref/': 'layout/spec_s/spec_ref/spec_ref.html',

    '/m/spec/detail': {
      'module': 'layout/spec_s/spec_detail/spec_detail.html',
      'composite': {
        'tab': '/?/spec/detail/tab/'
      }
    },
    '/m/spec/detail/doc/': 'layout/spec_s/spec_detail_tab_s/spec_detail_doc/spec_detail_doc.html',
    '/m/spec/detail/template/': 'layout/spec_s/spec_detail_tab_s/spec_detail_template/spec_detail_template.html',
    '/m/spec/detail/setting/': 'layout/spec_s/spec_detail_tab_s/spec_detail_setting/spec_detail_setting.html',
    '/m/spec/detail/history/': 'layout/spec_s/spec_detail_tab_s/spec_detail_history/spec_detail_history.html',

    '/m/progroup': {
      'module': 'layout/progroup/progroup.html',
      'composite': {
        'tree': '/?/progroup/tree/'
      }
    },
    '/m/progroup/home': {
      'module': 'layout/progroup_home/progroup_home.html',
      'composite': {
        'tab': '/?/progroup/home/tab/'
      }
    },
    '/m/progroup/home/activity/': 'layout/progroup_home_tab_s/progroup_activity/progroup_activity.html',
    '/m/progroup/home/management/': {
      'module': 'layout/progroup_home_tab_s/progroup_management/progroup_management.html',
      'composite': {
        'apply': '/?/progroup/applylist/'
      }
    },

    '/m/progroup/search': {
      'module': 'layout/progroup_search/progroup_search.html',
      'composite': {
        'tab': '/?/progroup/search/tab/'
      }
    },
    '/m/progroup/search/group/': 'layout/progroup_search_tab_s/progroup_searchresult/progroup_searchresult.html',
    '/m/progroup/search/project/': 'layout/progroup_search_tab_s/progroup_searchresult/progroup_searchresult.html',

    '/m/progroup/detail': {
      'module': 'layout/progroup_detail/progroup_detail.html',
      'composite': {
        'tab': '/?/progroup/detail/tab/'
      }
    },
    '/m/progroup/detail/activity/': 'layout/progroup_detail_tab_s/progroup_detail_a/progroup_detail_a.html',
    '/m/progroup/detail/project/': 'layout/progroup_detail_tab_s/progroup_detail_p/progroup_detail_p.html',
    '/m/progroup/detail/projectmanage/': 'layout/progroup_detail_tab_s/progroup_detail_pm/progroup_detail_pm.html',
    '/m/progroup/detail/privilege/': 'layout/progroup_detail_tab_s/progroup_detail_pr/progroup_detail_pr.html',
    '/m/progroup/detail/team/': 'layout/progroup_detail_tab_s/progroup_detail_t/progroup_detail_t.html',
    '/m/progroup/detail/tool/': 'layout/progroup_detail_tab_s/progroup_detail_tl/progroup_detail_tl.html',
    '/m/progroup/detail/teammanage/': 'layout/progroup_detail_tab_s/progroup_detail_tm/progroup_detail_tm.html',

    '/m/progroup/p': {
      'module': 'layout/progroup_p/progroup_p.html',
      'composite': {
        'tab': '/?/progroup/p/tab/'
      }
    },
    '/m/progroup/p/detail/': 'layout/progroup_p_tab_s/progroup_p_d/progroup_p_d.html',
    '/m/progroup/p/page/': 'layout/progroup_p_tab_s/progroup_p_p/progroup_p_p.html',
    '/m/progroup/p/page/detail/': 'layout/progroup_p_tab_s/progroup_p_p_detail/progroup_p_p_detail.html',
    '/m/progroup/p/page/create/': 'layout/progroup_p_tab_s/progroup_p_p_create/progroup_p_p_create.html',
    '/m/progroup/p/tool/': 'layout/progroup_p_tab_s/progroup_p_t/progroup_p_t.html',

    '/m/progroup/p/res': {
      'module': 'layout/progroup_p_tab_s/progroup_p_r/progroup_p_r.html',
      'composite': {
        'tab': '/?/res/tab/'
      }
    },
    '/m/progroup/p/activity/': 'layout/progroup_p_tab_s/progroup_p_a/progroup_p_a.html',

    '/m/progroup/p/res/interface/': 'layout/res_tab_s/res_interface/res_interface.html',
    '/m/progroup/p/res/interface/ref/': 'layout/res_tab_s/res_interface_ref/res_interface_ref.html',
    '/m/progroup/p/res/interface/create/': 'layout/res_tab_s/res_interface_create/res_interface_create.html',
    '/m/progroup/p/res/interface/detail': {
      'module': 'layout/res_tab_s/res_interface_detail/res_interface_detail.html',
      'composite': {
        'tab': '/?/res/interface/detail/tab/'
      }
    },
    '/m/progroup/p/res/interface/detail/req/': 'layout/res_interface_detail_tab_s/interface_detail_req/interface_detail_req.html',
    '/m/progroup/p/res/interface/detail/res/': 'layout/res_interface_detail_tab_s/interface_detail_res/interface_detail_res.html',
    '/m/progroup/p/res/interface/detail/mockstore/': 'layout/res_interface_detail_tab_s/interface_detail_mockstore/interface_detail_mockstore.html',
    '/m/progroup/p/res/interface/detail/version/': 'layout/res_interface_detail_tab_s/interface_detail_version/interface_detail_version.html',
    '/m/progroup/p/res/interface/detail/statistics/': 'layout/res_interface_detail_tab_s/interface_detail_statistics/interface_detail_statistics.html',
    '/m/progroup/p/res/interface/detail/activity/': 'layout/res_interface_detail_tab_s/interface_detail_activity/interface_detail_activity.html',

    '/m/progroup/p/res/rpc/': 'layout/res_tab_s/res_rpc/res_rpc.html',
    '/m/progroup/p/res/rpc/ref/': 'layout/res_tab_s/res_rpc_ref/res_rpc_ref.html',
    '/m/progroup/p/res/rpc/create/': 'layout/res_tab_s/res_rpc_create/res_rpc_create.html',
    '/m/progroup/p/res/rpc/detail': {
      'module': 'layout/res_tab_s/res_rpc_detail/res_rpc_detail.html',
      'composite': {
        'tab': '/?/res/rpc/detail/tab/'
      }
    },
    '/m/progroup/p/res/rpc/detail/req/': 'layout/res_rpc_detail_tab_s/rpc_detail_req/rpc_detail_req.html',
    '/m/progroup/p/res/rpc/detail/res/': 'layout/res_rpc_detail_tab_s/rpc_detail_res/rpc_detail_res.html',
    '/m/progroup/p/res/rpc/detail/version/': 'layout/res_rpc_detail_tab_s/rpc_detail_version/rpc_detail_version.html',
    '/m/progroup/p/res/rpc/detail/activity/': 'layout/res_rpc_detail_tab_s/rpc_detail_activity/rpc_detail_activity.html',

    '/m/progroup/p/res/template/': 'layout/res_tab_s/res_template/res_template.html',
    '/m/progroup/p/res/template/create/': 'layout/res_tab_s/res_template_create/res_template_create.html',
    '/m/progroup/p/res/template/detail/': 'layout/res_tab_s/res_template_detail/res_template_detail.html',
    '/m/progroup/p/res/template/ref/': 'layout/res_tab_s/res_template_ref/res_template_ref.html',

    '/m/progroup/p/res/datatype/': 'layout/res_tab_s/res_datatype/res_datatype.html',
    '/m/progroup/p/res/datatype/create/': 'layout/res_tab_s/res_datatype_create/res_datatype_create.html',
    '/m/progroup/p/res/datatype/ref/': 'layout/res_tab_s/res_datatype_ref/res_datatype_ref.html',
    '/m/progroup/p/res/datatype/detail': {
      'module': 'layout/res_tab_s/res_datatype_detail/res_datatype_detail.html',
      'composite': {
        'tab': '/?/res/datatype/detail/tab/'
      }
    },
    '/m/progroup/p/res/datatype/detail/attribute/': 'layout/res_datatype_detail_tab_s/datatype_detail_attribute/datatype_detail_attribute.html',
    '/m/progroup/p/res/datatype/detail/version/': 'layout/res_datatype_detail_tab_s/datatype_detail_version/datatype_detail_version.html',
    '/m/progroup/p/res/datatype/detail/activity/': 'layout/res_datatype_detail_tab_s/datatype_detail_activity/datatype_detail_activity.html',

    '/m/progroup/p/res/constraint/': 'layout/res_tab_s/res_constraint/res_constraint.html',
    '/m/progroup/p/res/constraint/create/': 'layout/res_tab_s/res_constraint_create/res_constraint_create.html',
    '/m/progroup/p/res/constraint/detail/': 'layout/res_tab_s/res_constraint_detail/res_constraint_detail.html',

    '/m/progroup/p/res/word/': 'layout/res_tab_s/res_word/res_word.html',
    '/m/progroup/p/res/word/create/': 'layout/res_tab_s/res_word_create/res_word_create.html',
    '/m/progroup/p/res/word/detail/': 'layout/res_tab_s/res_word_detail/res_word_detail.html',

    '/m/progroup/p/res/group/': 'layout/res_tab_s/res_group/res_group.html',
    '/m/progroup/p/res/group/create/': 'layout/res_tab_s/res_group_create/res_group_create.html',
    '/m/progroup/p/res/group/detail/': 'layout/res_tab_s/res_group_detail/res_group_detail.html',
    '/m/progroup/p/res/group/ref/': 'layout/res_tab_s/res_group_ref/res_group_ref.html',

    '/m/progroup/p/res/client/': 'layout/res_tab_s/res_client/res_client.html',
    '/m/progroup/p/res/client/create/': 'layout/res_tab_s/res_client_create/res_client_create.html',
    '/m/progroup/p/res/client/detail/': 'layout/res_tab_s/res_client_detail/res_client_detail.html',
    '/m/progroup/p/res/client/ref/': 'layout/res_tab_s/res_client_ref/res_client_ref.html',

    '/m/test': {
      'module': 'layout/test/test.html',
      'composite': {
        'tab': '/?/test/tab/',
        'mainTab': '/?/test/main/tab/'
      }
    },
    '/m/test/record': {
      'module': 'layout/test_tab_s/test_record/test_record.html',
      'composite': {
        'tab': '/?/test/main/tab/tab/'
      }
    },
    '/m/test/record/create/': 'layout/test_main_tab_tab_s/test_create/test_create.html',
    '/m/test/record/report/': 'layout/test_main_tab_tab_s/test_report/test_report.html',
    '/m/test/record/constraint/': 'layout/res_tab_s/res_constraint/res_constraint.html',
    '/m/test/record/constraint/create/': 'layout/res_tab_s/res_constraint_create/res_constraint_create.html',
    '/m/test/record/constraint/detail/': 'layout/res_tab_s/res_constraint_detail/res_constraint_detail.html',

    '/m/test/group': {
      'module': 'layout/test_tab_s/test_group/test_group.html',
      'composite': {
        'tab': '/?/test/main/tab/tab/'
      }
    },
    '/m/test/group/create/': 'layout/test_main_tab_tab_s/test_create/test_create.html',
    '/m/test/group/case/': 'layout/test_main_tab_tab_s/test_case/test_case.html',
    '/m/test/group/case/detail/': 'layout/test_main_tab_tab_s/test_case_detail/test_case_detail.html',
    '/m/test/group/report/': 'layout/test_main_tab_tab_s/test_report/test_report.html',
    '/m/test/group/suite/': 'layout/test_main_tab_tab_s/collection/list.html',
    '/m/test/group/dependency/': 'layout/test_main_tab_tab_s/dependency_test/dependency_test.html',

    '/m/notification': {
      'module': 'layout/notification/notification.html',
      'composite': {
        'tab': '/?/notification/tab/'
      }
    },
    '/m/notification/system/': 'layout/notification_tab_s/notification_system/notification_system.html',
    '/m/notification/personal/': 'layout/notification_tab_s/notification_personal/notification_personal.html',
    '/m/notification/api/': 'layout/notification_tab_s/notification_api/notification_api.html',
    '/m/notification/audit/': 'layout/notification_tab_s/notification_audit/notification_audit.html',
    '/m/globalsearch/interfaces/': {
      'module': 'layout/global_search/search_result/result.html',
      'composite': {
        'tab': '/?/m/global_search/search_result_tab/'
      }
    },
    '/m/globalsearch/rpcs/': {
      'module': 'layout/global_search/search_result/result.html',
      'composite': {
        'tab': '/?/m/global_search/search_result_tab/'
      }
    },
    '/m/globalsearch/datatypes/': {
      'module': 'layout/global_search/search_result/result.html',
      'composite': {
        'tab': '/?/m/global_search/search_result_tab/'
      }
    },
    '/m/globalsearch/constraints/': {
      'module': 'layout/global_search/search_result/result.html',
      'composite': {
        'tab': '/?/m/global_search/search_result_tab/'
      }
    },
    '/m/globalsearch/words/': {
      'module': 'layout/global_search/search_result/result.html',
      'composite': {
        'tab': '/?/m/global_search/search_result_tab/'
      }
    },
    '/m/globalsearch/pages/': {
      'module': 'layout/global_search/search_result/result.html',
      'composite': {
        'tab': '/?/m/global_search/search_result_tab/'
      }
    },
    '/m/globalsearch/templates/': {
      'module': 'layout/global_search/search_result/result.html',
      'composite': {
        'tab': '/?/m/global_search/search_result_tab/'
      }
    },
    '/m/globalsearch/groups/': {
      'module': 'layout/global_search/search_result/result.html',
      'composite': {
        'tab': '/?/m/global_search/search_result_tab/'
      }
    },
    '/m/globalsearch/projects/': {
      'module': 'layout/global_search/search_result/result.html',
      'composite': {
        'tab': '/?/m/global_search/search_result_tab/'
      }
    },
    '/m/globalsearch/progroups/': {
      'module': 'layout/global_search/search_result/result.html',
      'composite': {
        'tab': '/?/m/global_search/search_result_tab/'
      }
    },
  };
});
