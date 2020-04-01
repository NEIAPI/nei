/**
 * notification sender
 */
let util = require('util');
let _ = require('../../util/utility');
let dbMap = require('../../../common').db;
let mailService = require('../MailService');
let sqlOpt = {noTransaction: true};
let userDao = new (require('../../dao/UserDao'))(sqlOpt);
let suDao = new (require('../../dao/SpecificationUserDao'))(sqlOpt);
let pguDao = new (require('../../dao/ProGroupUserDao'))(sqlOpt);
let projectDao = new (require('../../dao/ProjectDao'))(sqlOpt);
let progroupDao = new (require('../../dao/ProGroupDao'))(sqlOpt);
let progroupUserDao = new (require('../../dao/ProGroupUserDao'))(sqlOpt);
let interfaceDao = new (require('../../dao/InterfaceDao'))(sqlOpt);
let templateDao = new (require('../../dao/TemplateDao'))(sqlOpt);
let datatypeDao = new (require('../../dao/DataTypeDao'))(sqlOpt);
let bisgroupDao = new (require('../../dao/BisGroupDao'))(sqlOpt);
let viewDao = new (require('../../dao/ViewDao'))(sqlOpt);
let specDao = new (require('../../dao/SpecificationDao'))(sqlOpt);
let rwDAO = new (require('../../dao/ResourceWatchDao'))(sqlOpt);
let notificationSettingDao = new (require('../../dao/NotificationSettingDao'))(sqlOpt);
let notificationDao = new (require('../../dao/NotificationDao'))(sqlOpt);

const resTypeName = {
  [dbMap.PAM_TYP_QUERY]: 'view',
  [dbMap.PAM_TYP_VMODEL]: 'template',
  [dbMap.PAM_TYP_INPUT]: 'interface',
  [dbMap.PAM_TYP_OUTPUT]: 'interface',
  [dbMap.PAM_TYP_ATTRIBUTE]: 'datatype',
  [dbMap.PAM_TYP_RPC_INPUT]: 'rpc',
  [dbMap.PAM_TYP_RPC_OUTPUT]: 'rpc',
};

const resTypeMap = {
  'view': dbMap.RES_TYP_WEBVIEW,
  'datatype': dbMap.RES_TYP_DATATYPE,
  'template': dbMap.RES_TYP_TEMPLATE,
  'interface': dbMap.RES_TYP_INTERFACE,
  'constraint': dbMap.RES_TYP_CONSTRAINT,
  'rpc': dbMap.RES_TYP_RPC,
};

const nmap = {
  specification: {
    url: '/spec/detail/?id=%s',
    dao: specDao,
    text: '您%s的%s工程规范%s已被%s%s'
  },
  progroup: {
    url: '/progroup/detail?pgid=%s',
    dao: progroupDao,
    del: {text: '%s 删除了项目组 %s', toAll: true},
    update: {text: '%s 更新了项目组 %s'},
    apply: {text: '%s 申请加入项目组 %s', toAdminAndOwner: true},
    enter: {text: '%s 加入了项目组 %s', isNotOpr: true},
    pass: {text: '您已加入项目组 %s', isMine: true},
    kick: {text: '您已从项目组 %s 中移除', isMine: true},
    reject: {text: '您被拒绝加入项目组 %s', isMine: true},
    change: {text: '您在项目组 %s 中的角色已被修改', isMine: true},
    quitOwn: {text: '您已退出项目组 %s', isMine: true},
    quitOthers: {text: '%s 退出了项目组 %s', filterRelavant: true},
    chCreator4Opr: {text: '您已将项目组 %s 移交给 %s', isNotOpr: true, toSelf: true}, //通知当前操作者文案
    chCreator4Successor: {text: '%s 已将项目组 %s 移交给您', isMine: true}, //通知被移交的人文案
    chCreator4Members: {text: '%s 已将项目组 %s 移交给 %s', isNotOpr: true, filterRelavant: true}, //通知项目组成员，除被操作者和被移交者
  },
  project: {
    dao: projectDao,
    text: '%s %s了项目%s',
    url: '/project/detail/?pid=%s',
    chCreator4Opr: {text: '您已将项目 %s 移交给 %s', isNotOpr: true, toSelf: true}, //通知当前操作者文案
    chCreator4Successor: {text: '%s 已将项目 %s 移交给您', isMine: true}, //通知被移交的人文案
    chCreator4Members: {text: '%s 已将项目 %s 移交给 %s', isNotOpr: true, filterRelavant: true}, //通知项目组成员，除被操作者和被移交者
  },
  view: {
    chinese: '页面',
    dao: viewDao,
    url: '/page/detail/?pid=%s&id=%s'
  },
  interface: {
    chinese: '接口',
    dao: interfaceDao,
    url: '/interface/detail/?pid=%s&id=%s',
    getQuoteMethodName: 'getListByInterface'

  },
  template: {
    chinese: '页面模板',
    dao: templateDao,
    url: '/template/detail/?pid=%s&id=%s',
    getQuoteMethodName: 'getListByTemplate'
  },
  datatype: {
    chinese: '数据模型',
    dao: datatypeDao,
    url: '/datatype/detail/?pid=%s&id=%s',
    onlyQuote: true
  },
  bisgroup: {
    chinese: '业务分组',
    dao: bisgroupDao,
    url: '/group/detail/?pid=%s&id=%s'
  }
};

const specOprTypeMap = {
  deShare: {
    text: '取消共享',
    ctext: '收藏'
  },
  collect: {
    text: '收藏',
    ctext: '创建'
  },
  del: {
    text: '删除',
    ctext: '收藏'
  }
};

const oprTypeMap = {
  add: '创建',
  update: '更新',
  del: '删除'
};

const specTypeMap = {
  [dbMap.CMN_TYP_WEB]: 'WEB',
  [dbMap.CMN_TYP_AOS]: 'AOS',
  [dbMap.CMN_TYP_IOS]: 'IOS',
  [dbMap.CMN_TYP_TEST]: 'TEST'
};

function validateEmail(email) {
  let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

let dumpName = function (oprType, url, name) {
  return _.relAndFullUrls(url, domain).map(it => {
    let tagBegin = `<a class="stateful" href="${it}">`;
    let tagEnd = '</a>';
    if (oprType === 'del') {
      tagBegin = tagEnd = '';
    }
    return util.format('【%s%s%s】', tagBegin, name, tagEnd);
  });
};

let addText = function (arr, oprType, resType, updateData) {
  let suffix = '';
  if (oprType === 'update' && /pro(ject|group)/.test(resType) && updateData) {
    suffix = updateData.hasOwnProperty('name') ? '的名称' :
      updateData.hasOwnProperty('description') ? '的描述' :
        ['toolKey', 'toolSpecWeb', 'toolSpecAos', 'toolSpecIos', 'toolSpecTest'].some(updateData.hasOwnProperty, updateData) ? '的工具设置'
          : '';
    return arr.map(it => it + suffix);
  }
  return arr;
};

let dumpTextAndToUsers = function*({
  propertyObj,
  resType,
  resource,
  oprType,
  operator,
  realUid,
  toUserIds
}) {
  let id = resource.id;
  let url = util.format(propertyObj.url, id);
  let rName = _.escapeHtml(resource.name);
  // build name (can be with link or not). [name, hasDomainName]
  let resNames = dumpName(oprType, url, rName);
  let oName = operator ? _.escapeHtml(operator.realname || operator.username) : '';

  let textTempalte = propertyObj[oprType] || propertyObj.text;
  let toUsers = [], skipFilterOperator = false, texts = [];
  if (resType === 'specification') {
    let type = specTypeMap[resource.type] || 'WEB';
    let oprObj = specOprTypeMap[oprType];
    if (!oprObj) {
      return {toUsers};
    }
    if (oprType === 'del' || oprType === 'deShare') {
      let userIds = toUserIds || (yield suDao.search({
          conds: {spec_id: id},
          sfields: ['user_id']
        })).map(item => item.userId);
      toUsers = yield userDao.findBatch(userIds);
    } else {
      // collect. notify creators.
      toUsers = [yield userDao.find(resource.creatorId)];
    }

    texts = resNames.map(it => {
      return util.format(
        textTempalte,
        oprObj.ctext, type, it, oName, oprObj.text
      );
    });
  } else if (/pro(ject|group)/.test(resType)) {
    if (resType === 'project' && !/^chCreator/.test(oprType)) {
      let pgUsers = yield pguDao.search({
        conds: {progroup_id: resource.progroupId}
      });
      let toUserIds = pgUsers.map(it => it.userId);
      toUsers = yield userDao.findBatch(toUserIds);

      texts = resNames.map(it => {
        return util.format(
          textTempalte,
          oName, oprTypeMap[oprType], it
        );
      });
      toUsers = toUsers.filter(it => it.id !== operator.id);
      return {toUsers, texts};
    }
    let textObj = textTempalte;
    textTempalte = textTempalte.text;
    let realname;
    if (textObj.isNotOpr) {
      // 文案中的涉及用户名不是操作者本身的情况
      let realUser = yield userDao.find(realUid);
      realname = _.escapeHtml(realUser.realname);
    }

    if (textObj.toAll || textObj.toAdminAndOwner) {
      // notify all progroup members or only admins and owners
      let roleArr = ['admins', 'owner'];
      if (textObj.toAll) {
        roleArr = roleArr.concat(['observers', 'developers', 'testers', 'auditors']);
      }
      let pgid = resType === 'progroup' ? id : resource.progroupId;
      let progroupUserObj = yield progroupUserDao.findDetailUser([pgid]);
      roleArr.forEach((key) => {
        if (progroupUserObj[id]) {
          progroupUserObj[id][key].forEach((item) => {
            if ((textObj.isNotOpr && item.id !== realUid || !textObj.isNotOpr)) {
              // 被加入者不接收群发加入消息
              toUsers.push(item);
            }
          });
        }
      });
    } else if (textObj.isMine) {
      toUsers = [yield userDao.find(realUid)];
    } else if (textObj.toSelf) {
      skipFilterOperator = true;
      toUsers = [operator];
    }

    // build texts
    if (/^chCreator/.test(oprType)) {
      // change creator text
      if (/4Opr$/.test(oprType)) {
        texts = resNames.map(it => {
          return util.format(textTempalte, it, realname);
        });
      } else if (/4Successor$/.test(oprType)) {
        texts = resNames.map(it => {
          return util.format(textTempalte, oName, it);
        });
      } else {
        texts = resNames.map(it => {
          return util.format(textTempalte, oName, it, realname);
        });
      }
    } else if (textObj.isMine) {
      // 通知被操作者的文案
      texts = resNames.map(it => {
        return util.format(textTempalte, it);
      });
    } else {
      // 删除和修改相关 和 成员变更的文案
      texts = resNames.map(it => {
        return util.format(textTempalte, realname || oName, it);
      });
    }
  } else { // resource
    textTempalte = '%s 在项目%s中%s了%s%s';
    // 接收者
    let toUserIds = [];
    let quoteRes = [];
    if (resource.respoId || (resource.respo && resource.respo.id)) {
      toUserIds.push(resource.respoId || resource.respo.id);
    }

    if (propertyObj.onlyQuote) {
      // only notify respos of the references for dataytpe changes
      if (operator && operator.id) {
        let datatypeService = new (require('../DataTypeService'))(operator.id, {'_neiSql': {}});
        let quoteResObj = yield datatypeService.getQuotes(id);
        Object.keys(quoteResObj).forEach((arrKey) => {
          let arr = quoteResObj[arrKey];
          quoteRes = quoteRes.concat(arr);
        });
      }
    } else if (propertyObj.getQuoteMethodName) { // view
      let quoteResObj = yield viewDao[propertyObj.getQuoteMethodName](id);
      let viewIds = quoteResObj.map(item => item.id);
      if (viewIds.length) {
        quoteRes = yield viewDao.findBatch(viewIds);
      }
    }
    quoteRes.forEach((item) => {
      if (item.respoId || (item.respo && item.respo.id)) {
        toUserIds.push(item.respoId || item.respo.id);
      }
    });

    //build project info
    let pid = resource.projectId;
    let project = yield projectDao.find(pid);
    if (!project) {
      return {};
    }
    let projecName = _.escapeHtml(project.name);
    let projectUrl = util.format(nmap['project'].url, pid);
    resNames = dumpName(oprType,
      util.format(propertyObj.url, pid, id),
      rName);
    let pNames = dumpName(oprType,
      projectUrl,
      projecName
    );

    texts = resNames.map((it, index) => {
      return util.format(textTempalte, oName, pNames[index],
        oprTypeMap[oprType], propertyObj['chinese'], it);
    });
    if (resTypeMap[resType] !== undefined) {
      let watchList = yield rwDAO.getListOfResourceWatch(pid, resTypeMap[resType]);
      if (watchList[id] && watchList[id].length) {
        toUserIds.push(...watchList[id]);
      }
    }

    //过滤非项目组成员
    if (resource.progroupId) {
      let pgUsers = yield pguDao.search({
        conds: {progroup_id: resource.progroupId}
      });
      let pgUserIds = pgUsers.map(it => it.userId);
      toUserIds = toUserIds.filter(it => {
        return pgUserIds.includes(it);
      });
    }

    if (toUserIds.length) {
      toUsers = yield userDao.findBatch(toUserIds);
    }
  }

  if (propertyObj[oprType] && propertyObj[oprType].filterRelavant) {
    toUsers = toUsers.filter(it => {
      return it.id !== operator.id && it.id != realUid;
    });
  } else if (!skipFilterOperator) {
    toUsers = toUsers.filter(it => {
      return it.id !== operator.id;
    });
  }
  return {
    toUsers,
    texts
  };
};

let notification = {
  * check(type, uid) {
    let sendNotification = process.appConfig.sendNotification || false;
    if (!sendNotification) {
      return sendNotification;
    }
    let methods = {
      paopao: 'methodPaopao',
      email: 'methodEmail',
    };
    let setting = yield notificationSettingDao.search({
      conds: {
        userId: uid,
        flag: dbMap.CMN_FLG_ON,
        [methods[type]]: dbMap.CMN_FLG_ON
      }
    });
    return !!setting.length;
  },

  * sendWeb(text, user) {
    user = user instanceof Array ? user : [user];
    return yield notificationDao.sendNotification(user.map(it => it.id), {
      content: '',
      title: text,
      type: dbMap.MSG_TYP_PRIVATE
    });
  },

  * sendMail(text, user) {
    if (!user.email || user.emailState === dbMap.CMN_FLG_OFF) {
      return;
    }
    let flag = yield notification.check('email', user.id);
    if (flag) {
      if (validateEmail(user.email)) {
        yield mailService.send('nei消息通知', [user.email], {
          type: 'notification',
          title: 'NEI消息通知',
          name: user.realname || user.username,
          content: text
        });
      }
    }
  },

  /**
   * notify users about the changes
   * @param  [Object] options - bunch of data used to build the notification
   * @param  [String] options.type - service type.
   * @param  [Array Number] options.ids - resouces ids.
   * @param  [String] options.oprType - operation type. e.g. add, remove
   * @param  [Array Number] options.realUid - ids of the users being updated. for progroup only
   * @param  [Array Object] options.updateData - update data. used only for update operation
   * @param  [Array Object] options.oldResources - old resources before the operation
   * @param  [Number] options.uid - user id of the operator
   * @return [Void]
   */* notify({
    type,
    ids,
    oprType,
    realUid,
    updateData,
    oldResources,
    uid,
    toUserIds
  }) {
    type = type.replace(/Service$/, '').toLowerCase();
    if (/^param/.test(type)) {
      //参数修改操作通知处理 修改为引用资源的操作
      if (updateData) {
        ids = [updateData.parentId];
        type = resTypeName[updateData.parentType];
      }
    }

    let propertyObj = nmap[type];
    if (!propertyObj) {
      return;
    }
    let dao = propertyObj.dao;
    // get operator
    let operator = yield userDao.find(uid);
    let resources = oldResources || (yield dao.findBatch(ids));
    let skipMedia = false;
    if (oprType === 'update' &&
      type === 'progroup' &&
      ['apiAudit', 'apiUpdateControl', 'showPublicList'].some(Object.prototype.hasOwnProperty, updateData)) {
      skipMedia = true;
    }
    for (let resource of resources) {
      let {toUsers, texts} =
        yield dumpTextAndToUsers({
          propertyObj, resType: type,
          resource, oprType, operator,
          realUid, updateData, toUserIds
        });
      if (!toUsers || !toUsers.length) {
        return;
      }
      let [text, hasDomainText] = addText(texts, oprType, type, updateData);

      yield notification.send({text, hasDomainText, toUsers, skipMedia});
    }
  },

  * send({text, hasDomainText, toUsers, skipMedia}) {
    if (!toUsers.length) {
      return;
    }
    yield notification.sendWeb(text, toUsers);
    if (skipMedia != null && !skipMedia) {
      for (let i = 0; i < toUsers.length; i++) {
        let toUser = toUsers[i];
        yield notification.sendMail(hasDomainText, toUser);
      }
    }
  },

  * sendApiChangeMsg({id, title, content, mailContent, paopaoContent, users, creatorId}) {
    let userIds = Array.isArray(users)
      ? users.map(it => it.id)
      : [users.id];

    let data = {
      title: title,
      content: content,
      type: dbMap.MSG_TYP_API
    };

    let opt = {
      resType: dbMap.RES_TYP_INTERFACE,
      resId: id,
      creatorId
    };

    yield notificationDao.sendNotification(userIds, data, opt);

    for (let user of users) {
      yield notification.sendMail(mailContent, user);
    }
  }
};

module.exports = notification;
