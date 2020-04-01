module.exports = {
  '/': {
    'view': '/index',
    'action': 'SiteController.index'
  },
  '/tutorial': {
    'view': '/tutorial',
    'action': 'SiteController.tutorial'
  },
  '/login': {
    'view': '/signup',
    'action': 'UserController.login'
  },
  '/register': {
    'view': '/signup',
    'action': 'UserController.register'
  },
  'POST /api/login': 'UserController.loginFromSite',
  'POST /api/register': 'UserController.registerFromSite',
  '/logout': 'UserController.logout',
  '/api/users/': 'UserController.getList',
  'PUT /api/users/': {
    'ctrl': 'UserController',
    'method': {
      'bind': 'bind',
      'verify': 'verify',
      'unbind': 'unbind'
    }
  },
  'PATCH /api/users/': 'UserController.update',
  // 访问令牌
  '/api/pats': 'PatController.getList',
  'POST /api/pats': 'PatController.create',
  'DELETE /api/pats/': 'PatController.revoke',
  'POST /api/applying/': 'ProgroupVerController.create',
  '/api/applying/': {
    'ctrl': 'ProgroupVerController',
    'de4lt': 'getListByUserId',
    'method': {
      'verifying': 'getApprovalListByUserId',
      'pgId': 'getListByProGroup'
    }
  },
  'PUT /api/applying/:id': {
    'ctrl': 'ProgroupVerController',
    'method': {
      'verify': 'approve'
    }
  },
  'POST /api/progroups/': 'ProgroupController.create',
  '/api/progroups/': {
    'ctrl': 'ProgroupController',
    'de4lt': 'getList',
    'method': {
      'search': 'search'
    }
  },
  '/api/progroups/:id': 'ProgroupController.getProgroupById',
  'PATCH /api/progroups/:id': 'ProgroupController.update',
  'DELETE /api/progroups/:id': 'ProgroupController.remove',
  'PUT /api/progroups/': 'ProgroupController.sort',
  'PUT /api/progroups/:id': {
    'ctrl': 'ProgroupController',
    'method': {
      'stick': 'stick',
      'lock': 'lock',
      'quit': 'quit',
      'changecreator': 'changeCreator',
      'setmembers': 'setMembers'
    }
  },
  'POST /api/projects/': {
    'ctrl': 'ProjectController',
    'de4lt': 'create',
    'method': {
      'clone': 'clone'
    }
  },
  '/api/projects/': {
    'ctrl': 'ProjectController',
    'method': {
      'recent': 'findRecent',
      'search': 'search'
    }
  },
  '/api/projects/:id': 'ProjectController.getProjectById',
  'PATCH /api/projects/:id': 'ProjectController.update',
  'DELETE /api/projects/:id': 'ProjectController.remove',
  'PUT /api/projects/:id': {
    'ctrl': 'ProjectController',
    'method': {
      'changecreator': 'changeCreator',
      'stick': 'stick',
      'rtk': 'rtk'
    }
  },
  'PUT /api/projects/': 'ProjectController.sort',
  'PATCH /api/projectres/': {
    'ctrl': 'ProjectController',
    'method': {
      'testcase': 'updateTestcase'
    }
  },
  '/api/projectres/': 'ProjectController.getAllDetailForTool',
  '/api/specificationres/': 'SpecificationController.getAllDetailForSpec',
  '/api/projectdoc/:id': 'ProjectController.getAllDetailForDoc',
  '/api/notifysettings/': 'NotificationController.getSettings',
  'PATCH /api/notifysettings/': 'NotificationController.updateSettings',
  '/api/notifications/': {
    'ctrl': 'NotificationController',
    'de4lt': 'getList',
    'method': {
      'res': 'getResourceNotifications',
      'unread': 'getUnread'
    }
  },
  'DELETE /api/notifications/': 'NotificationController.removeBatch',
  'DELETE /api/notifications/:id': 'NotificationController.remove',
  'PATCH /api/notifications/': {
    'ctrl': 'NotificationController',
    'method': {
      'read': 'markRead',
      'readall': 'markAllRead'
    }
  },
  '/api/activities/': {
    'ctrl': 'ResourceHistoryController',
    'de4lt': 'find',
    'method': {
      'spec': 'findForSpec',
      'all': 'findAll'
    }
  },
  '/api/watches': 'ResourceWatchController.getList',
  'POST /api/specs/': 'SpecificationController.create',
  '/api/specs/': 'SpecificationController.getList',
  '/api/specs/:id': {
    'ctrl': 'SpecificationController',
    'de4lt': 'findDetailById',
    'method': {
      'ref': 'getQuotes'
    }
  },
  'PATCH /api/specs/:id': 'SpecificationController.update',
  'DELETE /api/specs/:id': 'SpecificationController.remove',
  'PUT /api/specs/:id': {
    'ctrl': 'SpecificationController',
    'method': {
      'favorite': 'favorite',
      'share': 'share',
      'lock': 'lock',
      'rtk': 'rtk'
    }
  },
  'POST /api/specs/:id': {
    'ctrl': 'SpecificationController',
    'method': {
      'clone': 'clone'
    }
  },
  'POST /api/specdocs/': {
    'ctrl': 'SpecificationDirectoryController',
    'de4lt': 'create',
    'method': {
      'bat': 'createBatch',
      'import': 'import'
    }
  },
  'DELETE /api/specdocs/:id': 'SpecificationDirectoryController.remove',
  'PATCH /api/specdocs/:id': 'SpecificationDirectoryController.update',
  'DELETE /api/specdocs/': {
    'ctrl': 'SpecificationDirectoryController',
    'de4lt': 'removeBatch',
    'method': {
      'empty': 'empty'
    }
  },
  '/api/specdocs/': {
    'ctrl': 'SpecificationDirectoryController',
    'de4lt': 'findNode',
    'method': {
      'token': 'getToken',
      'export': 'export'
    }
  },
  'PUT /api/specdocs/': {
    'ctrl': 'SpecificationDirectoryController',
    'method': {
      'move': 'moveNode'
    }
  },
  '/api/klassmaps/': 'SpecificationKlassmapController.getList',
  'POST /api/klassmaps/': 'SpecificationKlassmapController.create',
  'PATCH /api/klassmaps/:id': 'SpecificationKlassmapController.update',
  'DELETE /api/klassmaps/': 'SpecificationKlassmapController.removeBatch',
  '/api/varmaps/': 'VarmapController.getList',
  'DELETE /api/varmaps/': 'VarmapController.removeBatch',
  'POST /api/varmaps/': 'VarmapController.create',
  'DELETE /api/varmaps/:id': 'VarmapController.remove',
  'PATCH /api/varmaps/:id': 'VarmapController.update',
  'POST /api/interfaces/': {
    'ctrl': 'InterfaceController',
    'de4lt': 'create',
    'method': {
      'clone': 'clone',
      'move': 'move',
      'crud': 'crud',
      'tag': 'tag',
      'bisgroup': 'updateBisGroupBatch',
      'newversion': 'createNewVersion',
      'status': 'updateStatusBatch',
      'watch': 'watchBatch',
      'bat': 'importBatch'
    }
  },
  'POST /api/interfaces/:id': {
    'ctrl': 'InterfaceController',
    'method': {
      'send2watch': 'sendMsgToWatch',
      'sendApiChangeMsgToWatch': 'sendApiChangeMsgToWatch'
    }
  },
  '/api/interfaces/': {
    'ctrl': 'InterfaceController',
    'method': {
      'pgId': 'getListByProgroupId',
      'pid': 'getListByProjectId',
      'bat': 'getListByIds',
      'search': 'search'
    }
  },
  '/api/interfaces/:id': {
    'ctrl': 'InterfaceController',
    'de4lt': 'findDetailById',
    'method': {
      'ref': 'getQuotes'
    }
  },
  'PATCH /api/interfaces/:id': 'InterfaceController.update',
  'DELETE /api/interfaces/': 'InterfaceController.remove',
  'PUT /api/interfaces/:id': {
    'ctrl': 'InterfaceController',
    'method': {
      'share': 'share',
      'watch': 'watch',
      'audit': 'audit',
      'reaudit': 'reAudit'
    }
  },
  'POST /api/rpcs/': {
    'ctrl': 'RpcController',
    'de4lt': 'create',
    'method': {
      'clone': 'clone',
      'move': 'move',
      'crud': 'crud',
      'tag': 'tag',
      'bisgroup': 'updateBisGroupBatch',
      'newversion': 'createNewVersion',
      'status': 'updateStatusBatch',
      'watch': 'watchBatch',
      'bat': 'importBatch'
    }
  },
  'POST /api/rpcs/:id': {
    'ctrl': 'RpcController',
    'method': {
      'send2watch': 'sendMsgToWatch',
      'sendApiChangeMsgToWatch': 'sendApiChangeMsgToWatch'
    }
  },
  '/api/rpcs/': {
    'ctrl': 'RpcController',
    'method': {
      'pgId': 'getListByProgroupId',
      'pid': 'getListByProjectId',
      'bat': 'getListByIds',
      'search': 'search'
    }
  },
  '/api/rpcs/:id': {
    'ctrl': 'RpcController',
    'de4lt': 'findDetailById',
    'method': {
      'ref': 'getQuotes'
    }
  },
  'PATCH /api/rpcs/:id': 'RpcController.update',
  'DELETE /api/rpcs/': 'RpcController.remove',
  'PUT /api/rpcs/:id': {
    'ctrl': 'RpcController',
    'method': {
      'share': 'share',
      'watch': 'watch',
      'audit': 'audit',
      'reaudit': 'reAudit'
    }
  },

  '/api/mockdata/': 'InterfaceController.getMockData',
  // 从某个 项目组 中查匹配的接口
  'ALL /api/apimock-v2/:toolKey/*': 'InterfaceController.getApiMockData',
  // 获取 mock 接口调用次数，首页展示用
  '/api/apimock/calltimes': 'InterfaceController.getApiMockCallTimes',
  // 从某个 项目 中查匹配的接口
  'ALL /api/apimock/:toolKey/*': 'InterfaceController.getApiMockData',
  'ALL /api/rpcmock-v2/:toolKey/*': 'RpcController.getApiMockData',
  'ALL /api/rpcmock/:toolKey/*': 'RpcController.getApiMockData',
  'POST /api/testcollections/': 'TestcaseCollectionController.create',
  '/api/testcollections/': 'TestcaseCollectionController.getList',
  '/api/testcollections/:id': 'TestcaseCollectionController.findDetailById',
  'PATCH /api/testcollections/:id': 'TestcaseCollectionController.update',
  'DELETE /api/testcollections/': 'TestcaseCollectionController.removeBatch',
  'DELETE /api/testcollections/:id': {
    'ctrl': 'TestcaseCollectionController',
    'de4lt': 'remove',
    'method': {
      'interface': 'delInterfaces',
      'testcase': 'delTestcases'
    }
  },
  'POST /api/testcollections/:id': {
    'ctrl': 'TestcaseCollectionController',
    'method': {
      'interface': 'addInterfaces',
      'testcase': 'addTestcases'
    }
  },
  'POST /api/hosts/': 'HostController.create',
  '/api/hosts/': 'HostController.getList',
  '/api/hosts/:id': 'HostController.findDetailById',
  'PATCH /api/hosts/:id': 'HostController.update',
  'DELETE /api/hosts/': 'HostController.removeBatch',
  'DELETE /api/hosts/:id': 'HostController.remove',
  'POST /api/groups/': 'BisGroupController.create',
  '/api/groups/:id': {
    'ctrl': 'BisGroupController',
    'de4lt': 'findDetailById',
    'method': {
      'ref': 'getQuotes'
    }
  },
  '/api/groups/': {
    'ctrl': 'BisGroupController',
    'de4lt': 'getList',
    'method': {
      'search': 'search'
    }
  },
  'PATCH /api/groups/:id': 'BisGroupController.update',
  'DELETE /api/groups/': 'BisGroupController.remove',
  'POST /api/document/': 'DocumentController.create',
  '/api/document/': 'DocumentController.getList',
  '/api/document/:id': 'DocumentController.findDetailById',
  'PATCH /api/document/:id': 'DocumentController.update',
  'DELETE /api/document/': 'DocumentController.remove',
  'POST /api/clients/': {
    'ctrl': 'ClientController',
    'de4lt': 'create',
    'method': {
      'clone': 'clone',
      'bisgroup': 'updateBisGroupBatch'
    }
  },
  '/api/clients/:id': {
    'ctrl': 'ClientController',
    'de4lt': 'findDetailById',
    'method': {
      'ref': 'getQuotes'
    }
  },
  '/api/clients/': 'ClientController.getList',
  'PATCH /api/clients/:id': 'ClientController.update',
  'PATCH /api/clients/': {
    'ctrl': 'ClientController',
    'method': {
      'bisgroup': 'updateBisGroupBatch'
    }
  },
  'DELETE /api/clients/': 'ClientController.remove',
  'POST /api/templates/': {
    'ctrl': 'TemplateController',
    'de4lt': 'create',
    'method': {
      'clone': 'clone',
      'move': 'move',
      'tag': 'tag',
      'bisgroup': 'updateBisGroupBatch',
      'bat': 'createBatch'
    }
  },
  '/api/templates/': {
    'ctrl': 'TemplateController',
    'method': {
      'pid': 'getListInProject',
      'search': 'search'
    }
  },
  '/api/templates/:id': {
    'ctrl': 'TemplateController',
    'de4lt': 'findDetailById',
    'method': {
      'ref': 'getQuotes'
    }
  },
  'PATCH /api/templates/:id': 'TemplateController.update',
  'DELETE /api/templates/': 'TemplateController.remove',
  'PUT /api/templates/:id': {
    'ctrl': 'TemplateController',
    'method': {
      'watch': 'watch'
    }
  },
  'POST /api/datatypes/': {
    'ctrl': 'DataTypeController',
    'de4lt': 'create',
    'method': {
      'clone': 'clone',
      'move': 'move',
      'tag': 'tag',
      'bisgroup': 'updateBisGroupBatch',
      'newversion': 'createNewVersion',
      'bat': 'createBatch'
    }
  },
  '/api/datatypes/': {
    'ctrl': 'DataTypeController',
    'de4lt': 'getList',
    'method': {
      'search': 'search'
    }
  },
  '/api/datatypes/:id': {
    'ctrl': 'DataTypeController',
    'de4lt': 'findDetailById',
    'method': {
      'ref': 'getQuotes'
    }
  },
  'PATCH /api/datatypes/:id': 'DataTypeController.update',
  'POST /api/datatypes/:id': 'DataTypeController.sendChangeMsgToWatch',
  'DELETE /api/datatypes/': 'DataTypeController.remove',
  'PUT /api/datatypes/:id': {
    'ctrl': 'DataTypeController',
    'method': {
      'share': 'share',
      'watch': 'watch'
    }
  },
  'POST /api/constraints/': {
    'ctrl': 'ConstraintController',
    'de4lt': 'create',
    'method': {
      'clone': 'clone',
      'tag': 'tag',
      'bisgroup': 'updateBisGroupBatch',
      'move': 'move'
    }
  },
  '/api/constraints/': {
    'ctrl': 'ConstraintController',
    'de4lt': 'getList',
    'method': {
      'search': 'search'
    }
  },
  '/api/constraints/:id': 'ConstraintController.findDetailById',
  'PATCH /api/constraints/:id': 'ConstraintController.update',
  'DELETE /api/constraints/': 'ConstraintController.remove',
  'PUT /api/constraints/:id': {
    'ctrl': 'ConstraintController',
    'method': {
      'share': 'share',
      'watch': 'watch'
    }
  },
  'POST /api/words/': {
    'ctrl': 'WordController',
    'de4lt': 'create',
    'method': {
      'clone': 'clone',
      'tag': 'tag',
      'bisgroup': 'updateBisGroupBatch',
      'move': 'move',
      'forbid': 'updateForbidBatch',
      'batchcreate': 'createBatch',
    }
  },
  '/api/words/': {
    'ctrl': 'WordController',
    'de4lt': 'getList',
    'method': {
      'search': 'search',
      'candidate': 'getCandidateList',
    }
  },
  '/api/words/:id': 'WordController.findDetailById',
  'PATCH /api/words/:id': 'WordController.update',
  'DELETE /api/words/': 'WordController.remove',
  'PUT /api/words/:id': {
    'ctrl': 'WordController',
    'method': {
      'share': 'share',
      'watch': 'watch'
    }
  },
  'POST /api/pages/': {
    'ctrl': 'ViewController',
    'de4lt': 'create',
    'method': {
      'clone': 'clone',
      'tag': 'tag',
      'move': 'move',
      'bisgroup': 'updateBisGroupBatch'
    }
  },
  '/api/pages/': {
    'ctrl': 'ViewController',
    'method': {
      'pid': 'getListInProject',
      'search': 'search'
    }
  },
  '/api/pages/:id': 'ViewController.findDetailById',
  'PATCH /api/pages/:id': 'ViewController.update',
  'DELETE /api/pages/': 'ViewController.remove',
  'PUT /api/pages/:id': {
    'ctrl': 'ViewController',
    'method': {
      'watch': 'watch'
    }
  },
  'POST /api/cliargs/': 'CliArgController.create',
  '/api/cliargs/': 'CliArgController.getList',
  'PATCH /api/cliargs/:id': 'CliArgController.update',
  'DELETE /api/cliargs/': 'CliArgController.remove',
  'POST /api/parameters/': 'ParameterController.create',
  'DELETE /api/parameters/': 'ParameterController.remove',
  'PATCH /api/parameters/:id': 'ParameterController.update',
  'PATCH /api/parameters/': {
    'ctrl': 'ParameterController',
    'de4lt': 'updateBatch',
    'method': {
      'position': 'updatePosition'
    }
  },
  'POST /api/iheaders/': 'HeaderController.create',
  'DELETE /api/iheaders/': 'HeaderController.remove',
  'PATCH /api/iheaders/:id': 'HeaderController.update',
  'PATCH /api/iheaders/': {
    'ctrl': 'HeaderController',
    'method': {
      'position': 'updatePosition'
    }
  },
  'POST /api/testcases/': 'TestcaseController.createBatch',
  '/api/testcases/': {
    'ctrl': 'TestcaseController',
    'method': {
      'collection': 'getListByCollectionOrInterface',
      'interfaceId': 'getListByCollectionOrInterface'
    }
  },
  '/api/testcases/:id': 'TestcaseController.findDetailById',
  'PATCH /api/testcases/:id': 'TestcaseController.update',
  'DELETE /api/testcases/': 'TestcaseController.remove',
  '/api/mockstore': {
    'ctrl': 'MockStoreController',
    'de4lt': 'get',
    'method': {}
  },
  'POST /api/mockstore': {
    'ctrl': 'MockStoreController',
    'de4lt': 'save',
    'method': {}
  },
  'PUT /api/mockstore/:interfaceId': {
    'ctrl': 'MockStoreController',
    'method': {
      'refresh': 'refresh'
    }
  },
  '/api/resview': {
    'ctrl': 'ResourceViewHistoryController',
    'de4lt': 'getList',
    'method': {}
  },
  // 访问令牌 api
  '/openapi/progroups/': 'OpenApiOfPATController.getProgroups',
  '/openapi/projects/': 'OpenApiOfPATController.getProjectsByPgid',
  '/openapi/projects/:id': 'OpenApiOfPATController.getProjectById',
  '/openapi/interfaces/': {
    'ctrl': 'OpenApiOfPATController',
    'de4lt': 'getInterfacesByPid',
    'method': {
      'bypath': 'getInterfaceDetailByPath'
    }
  },
  '/openapi/interfaces/:id': {
    'ctrl': 'OpenApiOfPATController',
    'de4lt': 'getInterfaceDetailById',
    'method': {
      'isupdated': 'isInterUpdated'
    }
  },
  '/openapi/rpcs/': {
    'ctrl': 'OpenApiOfPATController',
    'de4lt': 'getRpcInterfacesByPid',
    'method': {
      'bymethodname': 'getRpcInterfaceDetailByMethodName'
    }
  },
  '/openapi/rpcs/:id': {
    'ctrl': 'OpenApiOfPATController',
    'de4lt': 'getRpcInterfaceDetailById',
    'method': {
      'isupdated': 'isRpcInterUpdated'
    }
  },
  '/openapi/datatypes/': {
    'ctrl': 'OpenApiOfPATController',
    'de4lt': 'getDatatypesByPid',
    'method': {
    }
  },
  '/doc': {
    'view': '/doc',
    'action': 'SiteController.home',
    'morePaths': [
      '/doc/interfaces/',
      '/doc/rpcs/',
      '/doc/datatypes/',
      '/doc/default/',
      '/doc/constraints/',
      '/doc/pages/',
      '/doc/templates/',
      '/doc/members/',
      '/doc/custom/',
      '/doc/all/'
    ]
  },
  '/dashboard': {
    'view': '/main',
    'action': 'SiteController.home',
    'morePaths': [
      '/setting/',
      '/setting/home/',
      '/setting/profile/',
      '/setting/personal-access-token/',
      '/setting/cache/',
      '/setting/password/',
      '/setting/notification/',
      '/spec/',
      '/spec/home/',
      '/spec/discover/',
      '/spec/create/',
      '/spec/detail/',
      '/spec/detail/doc/',
      '/spec/detail/template/',
      '/spec/detail/setting/',
      '/spec/detail/history/',
      '/spec/list/',
      '/spec/ref/',
      '/progroup/',
      '/progroup/home/activity/',
      '/progroup/home/management/',
      '/progroup/search/group/',
      '/progroup/search/project/',
      '/progroup/detail/',
      '/progroup/detail/activity/',
      '/progroup/detail/project/',
      '/progroup/detail/projectmanage/',
      '/progroup/detail/privilege/',
      '/progroup/detail/team/',
      '/progroup/detail/tool/',
      '/progroup/detail/toolmanage/',
      '/progroup/detail/teammanage/',
      '/search/group/',
      '/search/project/',
      '/project/',
      '/project/detail/',
      '/page/',
      '/page/detail/',
      '/page/create/',
      '/project/res/',
      '/interface/',
      '/interface/create/',
      '/interface/detail/',
      '/interface/detail/req/',
      '/interface/detail/res/',
      '/interface/detail/case/',
      '/interface/detail/mockstore/',
      '/interface/detail/version/',
      '/interface/detail/statistics/',
      '/interface/detail/activity/',
      '/interface/ref/',
      '/rpc/',
      '/rpc/create/',
      '/rpc/detail/',
      '/rpc/detail/req/',
      '/rpc/detail/res/',
      '/rpc/detail/version/',
      '/rpc/detail/activity/',
      '/testcase/create/',
      '/testcase/detail/',
      '/testcase/report/',
      '/template/',
      '/template/create/',
      '/template/detail/',
      '/template/ref/',
      '/datatype/',
      '/datatype/create/',
      '/datatype/detail/',
      '/datatype/ref/',
      '/datatype/detail/attribute',
      '/datatype/detail/version',
      '/datatype/detail/activity',
      '/constraint/',
      '/constraint/create/',
      '/constraint/detail/',
      '/word/',
      '/word/create/',
      '/word/detail/',
      '/group/',
      '/group/create/',
      '/group/detail/',
      '/group/ref/',
      '/project/tool/',
      '/project/activity/',
      '/client/',
      '/client/create/',
      '/client/detail/',
      '/client/ref/',
      '/notification/',
      '/notification/system/',
      '/notification/personal/',
      '/notification/api/',
      '/notification/audit/',
      '/test/',
      '/test/record/',
      '/test/record/create/',
      '/test/record/report/',
      '/test/record/constraint/',
      '/test/record/constraint/create/',
      '/test/record/constraint/detail/',
      '/test/record/word/',
      '/test/record/word/create/',
      '/test/record/word/detail/',
      '/test/group/',
      '/test/group/create/',
      '/test/group/suite/',
      '/test/group/dependency/',
      '/test/group/report/',
      '/test/group/case/',
      '/test/group/case/detail/',
      '/globalsearch/interfaces',
      '/globalsearch/rpcs',
      '/globalsearch/datatypes',
      '/globalsearch/constraints',
      '/globalsearch/words',
      '/globalsearch/pages',
      '/globalsearch/templates',
      '/globalsearch/groups',
      '/globalsearch/projects',
      '/globalsearch/progroups'
    ]
  }
};
