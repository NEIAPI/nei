SET NAMES utf8;
CREATE DATABASE IF NOT EXISTS `nei-test` DEFAULT CHARACTER SET utf8mb4;

USE `nei-test`;

# 清除表结构
DROP TABLE IF EXISTS `resource_history`;
DROP TABLE IF EXISTS `interface_testcase`;
DROP TABLE IF EXISTS `interface_testcase_history`;
DROP TABLE IF EXISTS `interface_header_overwrite`;
DROP TABLE IF EXISTS `interface_header_combination`;
DROP TABLE IF EXISTS `interface_header`;
DROP TABLE IF EXISTS `interface_testcase_host`;
DROP TABLE IF EXISTS `view_interface`;
DROP TABLE IF EXISTS `view_template`;
DROP TABLE IF EXISTS `interface`;
DROP TABLE IF EXISTS `template`;
DROP TABLE IF EXISTS `constraint`;
DROP TABLE IF EXISTS `parameter_overwrite`;
DROP TABLE IF EXISTS `parameter_combination`;
DROP TABLE IF EXISTS `client`;
DROP TABLE IF EXISTS `resource_version`;
DROP TABLE IF EXISTS `resource_client`;
DROP TABLE IF EXISTS `resource_watch`;
DROP TABLE IF EXISTS `parameter`;
DROP TABLE IF EXISTS `datatype`;
DROP TABLE IF EXISTS `bisgroup`;
DROP TABLE IF EXISTS `view`;
DROP TABLE IF EXISTS `arguments`;
DROP TABLE IF EXISTS `project`;
DROP TABLE IF EXISTS `progroup_api_spec`;
DROP TABLE IF EXISTS `progroup_verification_op`;
DROP TABLE IF EXISTS `progroup_verification`;
DROP TABLE IF EXISTS `progroup_usrgroup`;
DROP TABLE IF EXISTS `progroup_user`;
DROP TABLE IF EXISTS `progroup`;
DROP TABLE IF EXISTS `specification_directory_web`;
DROP TABLE IF EXISTS `specification_directory`;
DROP TABLE IF EXISTS `specification_history`;
DROP TABLE IF EXISTS `specification_varmap`;
DROP TABLE IF EXISTS `specification_klassmap`;
DROP TABLE IF EXISTS `specification_user`;
DROP TABLE IF EXISTS `specification`;
DROP TABLE IF EXISTS `notification_setting`;
DROP TABLE IF EXISTS `notification_resource`;
DROP TABLE IF EXISTS `notification_user`;
DROP TABLE IF EXISTS `notification`;
DROP TABLE IF EXISTS `usrgroup_user`;
DROP TABLE IF EXISTS `usrgroup`;
DROP TABLE IF EXISTS `usrlogin`;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `testcase_collection`;
DROP TABLE IF EXISTS `collection_interface_testcase`;
DROP TABLE IF EXISTS `progroup_ip`;
DROP TABLE IF EXISTS `call_apimock`;
DROP TABLE IF EXISTS `resource_view_history`;
DROP TABLE IF EXISTS `status`;
DROP TABLE IF EXISTS `word`;
DROP TABLE IF EXISTS `word_overwrite`;
DROP TABLE IF EXISTS `pat`;
DROP TABLE IF EXISTS `document`;
DROP TABLE IF EXISTS `audit`;

# 创建表结构

# 用户表
CREATE TABLE `user` (
    `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户标识',
    `username`            VARCHAR(50) NULL DEFAULT NULL COMMENT '用户账号，对于第三方登录的账号，此处保存第三方过来的账号',
    `email`               VARCHAR(50) NULL DEFAULT NULL COMMENT '邮箱地址',
    `email_state`         TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '邮箱绑定状态\n\n0 － 未绑定\n1 － 已绑定',
    `phone`               VARCHAR(20) NULL DEFAULT '' COMMENT '手机号码',
    `phone_state`         TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '手机号码绑定状态\n\n0 － 未绑定\n1 － 已绑定',
    `password`            VARCHAR(50) NOT NULL DEFAULT '' COMMENT '登录密码，对于第三方账号登录的用户此处没有密码',
    `password_salt`       VARCHAR(45) NOT NULL DEFAULT '' COMMENT '密码盐值',
    `realname`            VARCHAR(50) NOT NULL DEFAULT '' COMMENT '用户真实姓名',
    `realname_pinyin`     VARCHAR(100) NOT NULL DEFAULT '' COMMENT '真实姓名拼音',
    `portrait`            VARCHAR(255) NOT NULL DEFAULT '' COMMENT '用户头像地址',
    `from`                TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '账号来源\n\n0 － 站内帐号',
    `company`             VARCHAR(50) NOT NULL DEFAULT '' COMMENT '用户所在企业',
    `role`                TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户角色\n\n0 － 未设置\n1 － 其它角色\n2 － 项目经理\n3 － 前端工程师\n4 － 后端工程师\n5 － IOS工程师\n6 － AOS工程师\n7 － 测试工程师\n8 － 运维工程师\n',
    `blog`                VARCHAR(100) NOT NULL DEFAULT '' COMMENT '个人博客地址',
    `github`              VARCHAR(50) NOT NULL DEFAULT '' COMMENT 'GitHub账号',
    `weixin`              VARCHAR(50) NOT NULL DEFAULT '' COMMENT '微信号',
    `yixin`               VARCHAR(50) NOT NULL DEFAULT '' COMMENT '易信号',
    `paopao`              VARCHAR(50) NOT NULL DEFAULT '' COMMENT '泡泡号',
    `qq`                  VARCHAR(50) NOT NULL DEFAULT '' COMMENT 'QQ号码',
    `job_time`            BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '参加工作时间',
    `create_time`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '帐号创建时间',
    `progroup_order`      TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '项目组排序方式\n\n\n0 - 自定义排序\n1 － 名称升序\n2 － 名称降序\n3 － 时间升序\n4 － 时间降序\n5 － 项目数量升序\n6 － 项目数量降序',
    `progroup_order_list` VARCHAR(1000) NOT NULL DEFAULT '' COMMENT '项目组自定义排序列表',
    `progroup_top_list`   VARCHAR(1000) NOT NULL DEFAULT '' COMMENT '项目组置顶列表',

    PRIMARY KEY (`id`),
    UNIQUE INDEX `uk_username` (`username` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='用户信息表';

# 用户登录记录表
CREATE TABLE `usrlogin` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录标识',
    `ip`            VARCHAR(50) NOT NULL DEFAULT '' COMMENT '登录IP',
    `address`       VARCHAR(255) NOT NULL DEFAULT '' COMMENT '登录地址',
    `user_id`       INT UNSIGNED NOT NULL COMMENT '用户标识',
    `login_from`    TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '登录来源\n\n0 － 站内登录',
    `login_time`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '登录时间',

    PRIMARY KEY (`id`)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='用户登录记录表';

# 站内通知信息表
CREATE TABLE `notification` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息标识',
    `type`          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '消息类型\n\n0 － 系统消息\n1 － 个人消息',
    `title`         VARCHAR(255) NOT NULL DEFAULT '' COMMENT '消息标题',
    `content`       TEXT COMMENT '消息内容',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '消息时间',

    PRIMARY KEY (`id`)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='站内通知表';

# 站内通知资源关联表
CREATE TABLE `notification_resource` (
    `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息标识',
    `notification_id`   BIGINT UNSIGNED NOT NULL COMMENT '消息标识',
    `res_id`            BIGINT UNSIGNED NOT NULL COMMENT '资源标识',
    `res_type`          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '资源类型',
    `create_time`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '消息时间',
    `creator_id`        INT UNSIGNED NOT NULL COMMENT '创建者标识',

    PRIMARY KEY (`id`)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='站内通知资源关联表';

# 站内通知 - 用户关系表
CREATE TABLE `notification_user` (
    `user_id`           INT UNSIGNED NOT NULL COMMENT '用户标识',
    `notification_id`   BIGINT UNSIGNED NOT NULL COMMENT '消息标识',
    `is_read`           TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '消息已读状态\n\n0 － 未读\n1 － 已读',
    `create_time`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '消息发送时间',

    PRIMARY KEY (`user_id`, `notification_id`),
    INDEX `idx_user_id` (`user_id` ASC),
    INDEX `idx_notification_id` (`notification_id` ASC)
)
ENGINE=InnoDB COMMENT='通知消息-用户关系表';

# 用户通知设置表
CREATE TABLE `notification_setting` (
    `user_id`           INT UNSIGNED NOT NULL COMMENT '用户标识',
    `flag`              TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '通知开关\n\n0 － 关闭通知功能\n1 － 开启通知功能',
    `method_yixin`      TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '通知方式 － 易信\n\n0 － 关闭\n1 － 开启',
    `method_email`      TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '通知方式 － 邮箱通知\n\n0 － 关闭\n1 － 开启',
    `method_phone`      TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '通知方式 － 手机\n\n0 － 关闭\n1 － 开启',
    `method_paopao`     TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '通知方式 － 泡泡\n\n0 － 关闭\n1 － 开启',

    PRIMARY KEY (`user_id`)
)
ENGINE=InnoDB COMMENT='通知设置表';

# 工程规范表
CREATE TABLE `specification` (
    `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '工程规范标识',
    `type`              TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '工程规范类型\n\n0 － WEB工程规范\n1 － AOS工程规范\n2 － IOS工程规范',
    `is_share`          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '工程规范是否共享\n\n0 － 未共享\n1 － 已共享',
    `is_system`         TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否系统预置规范\n\n0 - 非系统预置，由用户创建\n1 - 系统预置规范，用户不可修改',
    `name`              VARCHAR(50) NOT NULL DEFAULT '' COMMENT '工程规范名称',
    `name_pinyin`       VARCHAR(100) NOT NULL DEFAULT '' COMMENT '规范名称拼音',
    `language`          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '工程实现语言\n\n0 - 其他\n\n针对WEB工程规范：\n\n11 - Java\n12 - Node\n13 - PHP\n\n针对Android工程\n\n11 - Java\n\n针对iOS工程\n\n31 - Swift\n32 - Objective-C',
    `description`       VARCHAR(1000) NOT NULL DEFAULT '' COMMENT '工程规范描述',
    `document`          MEDIUMTEXT NULL COMMENT '规范文档，支持Markdown格式',
    `args_config`       BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '命令行参数配置文件',
    `helpers_config`    BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '模版引擎辅助函数',
    `creator_id`        INT UNSIGNED NOT NULL COMMENT '工程规范创建者标识',
    `tool_key`          VARCHAR(32) NOT NULL DEFAULT '' COMMENT '工具使用的标识',
    `create_time`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '工程规范创建时间',
    `is_lock`           TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '工程规范是否锁定\n\n0 － 未锁定\n1 － 已锁定',
    `engine`            TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '当前WEB工程使用的模板引擎\n\n0 －无 \n\n11 － Freemarker\n12 － Velocity\n\n21 － EJS\n22 － Swig\n\n31 － Smarty',
    `view_root`         BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '模板根节点',
    `web_root`          BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '前端资源根节点',
    `view_extension`    VARCHAR(20) NOT NULL DEFAULT '' COMMENT '模板文件扩展名',
    `mock_api_root`     BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '接口MOCK数据输出根节点',
    `mock_view_root`    BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '模板填充MOCK数据输出根节点',
    `jar_root`          BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'jar包根目录',

    PRIMARY KEY (`id`),
    INDEX `idx_creator_id` (`creator_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='工程规范表';

# 工程规范收藏表
CREATE TABLE `specification_user` (
    `user_id`       INT UNSIGNED NOT NULL COMMENT '用户标识',
    `spec_id`       INT UNSIGNED NOT NULL COMMENT '工程规范标识',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '关系建立时间',

    PRIMARY KEY (`user_id`, `spec_id`),
    INDEX `idx_spec_id` (`spec_id` ASC)
)
ENGINE=InnoDB COMMENT='工程规范－用户关系表';

# 工程规范变量映射表
CREATE TABLE `specification_varmap` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '映射关系标识',
    `type`          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '工程规范类型\n\n0 － WEB工程规范\n1 － AOS工程规范\n2 － IOS工程规范\n3 － 测试工程规范\n',
    `parent_id`     INT UNSIGNED NOT NULL COMMENT '映射关系归属标识',
    `parent_type`   TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '映射关系归属类型\n\n0 - 工程规范\n1 - 项目组\n2 - 项目',
    `org_name`      VARCHAR(50) NOT NULL COMMENT '原始数据类型名称',
    `var_name`      VARCHAR(50) NOT NULL COMMENT '映射代码变量名称',
    `creator_id`    INT UNSIGNED NOT NULL COMMENT '创建者标识',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',

    PRIMARY KEY (`id`),
    INDEX `idx_creator_id` (`creator_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='工程规范变量映射表';

# 工程规范实例名称和类名(带包名)映射表
CREATE TABLE `specification_klassmap` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '映射关系标识',
    `spec_id`       INT UNSIGNED NOT NULL COMMENT '归属规范标识',
    `instance_name` VARCHAR(500) NOT NULL COMMENT '实例名称',
    `klass_name`    VARCHAR(500) NOT NULL COMMENT '类名称',
    `creator_id`    INT UNSIGNED NOT NULL COMMENT '创建者标识',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',

    PRIMARY KEY (`id`),
    INDEX `idx_creator_id` (`creator_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='工程规范实例名称和类名(带包名)映射表';

# 工程规范操作记录
CREATE TABLE `specification_history` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '操作记录标识',
    `user_id`       INT UNSIGNED NOT NULL COMMENT '操作用户标识',
    `spec_id`       INT UNSIGNED NOT NULL COMMENT '规范标识',
    `op_data`       TEXT COMMENT '操作保存的额外数据，JSON字符串',
    `op_action`     TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '操作标识\n\n1 － 增加\n2 － 删除\n3 － 修改\n4 － 查看\n\n',
    `op_content`    TEXT COMMENT '操作描述信息',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '操作时间',

    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id` ASC),
    INDEX `idx_spec_id` (`spec_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='规范相关操作记录';

# 工程规范目录结构
CREATE TABLE `specification_directory` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '节点标识',
    `spec_id`       INT UNSIGNED NOT NULL COMMENT '节点归属的规范标识',
    `parent`        BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '节点所在父节点标识',
    `type`          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '节点类型\n\n0 － 目录\n1 － 文件',
    `name`          VARCHAR(255) NOT NULL DEFAULT '' COMMENT '节点名称',
    `description`   VARCHAR(500) NOT NULL DEFAULT '' COMMENT '节点描述',
    `mime`          VARCHAR(100) NOT NULL DEFAULT '' COMMENT '对于type为1的节点（即文件），指定文件的类型及高亮的语法，比如text/javascript',
    `content`       MEDIUMTEXT COMMENT '文件内容，如果是非文本文件则此字段存储文件对应的URL地址',
    `data_source`   TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '填充的数据模型类别\n0 - 没有数据模型\n1 - 异步接口列表\n2 - 数据模型列表\n3 - 页面模板列表\n4 - 页面视图列表\n5 - 自定义handleBar辅助函数',

    PRIMARY KEY (`id`),
    INDEX `idx_spec_id` (`spec_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='工程规范目录结构表';

# WEB工程目录规范特有属性
CREATE TABLE `specification_directory_web` (
    `spec_id`         INT UNSIGNED NOT NULL COMMENT '工程规范标识',
    `engine`          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '当前WEB工程使用的模板引擎\n\n0 －无 \n\n11 － Freemarker\n12 － Velocity\n\n21 － EJS\n22 － Swig\n\n31 － Smarty',
    `web_root`        BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '前端资源根节点',
    `view_root`       BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '模板根节点',
    `view_extension`  VARCHAR(20) NOT NULL DEFAULT '' COMMENT '模板文件扩展名',
    `mock_api_root`   BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '接口MOCK数据输出根节点',
    `mock_view_root`  BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '模板填充MOCK数据输出根节点',
    `jar_root`        BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'jar包根目录',

    PRIMARY KEY (`spec_id`),
    INDEX `idx_root_node` (`web_root` ASC, `view_root` ASC, `mock_api_root` ASC, `mock_view_root` ASC)
)
ENGINE=InnoDB COMMENT='WEB工程规范特有信息表';

# 项目组表
CREATE TABLE `progroup` (
    `id`                    INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '项目组标识',
    `type`                  TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '项目组类型\n\n0 － 常规项目组\n1 － 默认项目组\n2 － 隐藏项目组',
    `logo`                  VARCHAR(255) NOT NULL DEFAULT '' COMMENT '产品LOGO地址',
    `name`                  VARCHAR(50) NOT NULL DEFAULT '' COMMENT '项目组名称',
    `name_pinyin`           VARCHAR(100) NOT NULL DEFAULT '' COMMENT '项目组名称拼音',
    `description`           VARCHAR(500) NOT NULL DEFAULT '' COMMENT '项目组描述',
    `creator_id`            INT UNSIGNED NOT NULL COMMENT '项目组创建者',
    `create_time`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '项目组创建时间',
    `project_order`         TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '项目排序方式',
    `project_order_list`    VARCHAR(1000) NOT NULL DEFAULT '' COMMENT '项目自定义排序列表',
    `project_top_list`      VARCHAR(1000) NOT NULL DEFAULT '' COMMENT '项目置顶列表',
    `verification`          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '验证方式\n\n0 － 验证通过\n1 － 自动通过',
    `verification_role`     TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '自动验证通过的角色\n\n0 － 观察者\n1 － 管理员\n2 － 开发者\n3 － 测试员',
    `tool_key`              VARCHAR(32) NOT NULL DEFAULT '' COMMENT '工具使用的标识',
    `tool_spec_web`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '项目组使用的默认WEB工程规范',
    `tool_spec_aos`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '项目组使用的默认AOS工程规范',
    `tool_spec_ios`         INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '项目组使用的默认IOS工程规范',
    `tool_spec_test`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '项目组使用的默认测试工程规范',
    `is_lock`               TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '项目组是否锁定\n\n0 － 未锁定\n1 － 已锁定',
    `api_audit`             TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '新建接口需要审核\n\n0 － 不需要\n1 － 需要',
    `api_update_control`    TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '更新接口需要接口关注者确认定\n\n0 － 不需要\n1 － 需要',
    `show_public_list`      TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '在普通项目的资源列表中显示公共资源列表定\n\n0 － 不显示\n1 － 显示',
    `use_word_stock`        TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否使用参数词库校验功能\n\n0 － 不开启\n1 － 开启',

    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_tool_key` (`tool_key` ASC),
    INDEX `idx_creator_id` (`creator_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='项目组表';

# 项目组-用户表
CREATE TABLE `progroup_user` (
    `role`          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户角色\n\n0 － 观察者\n1 － 开发者\n2 － 测试员\n9 － 管理员\n10 － 拥有者',
    `user_id`       INT UNSIGNED NOT NULL COMMENT '用户标识',
    `progroup_id`   INT UNSIGNED NOT NULL COMMENT '项目组标识',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',

    PRIMARY KEY (`user_id`, `progroup_id`),
    INDEX `idx_progroup_id` (`progroup_id` ASC)
)
ENGINE=InnoDB COMMENT='项目组-用户关系表';

# 权限申请记录表
CREATE TABLE `progroup_verification` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '申请记录标识',
    `message`       VARCHAR(500) NOT NULL DEFAULT '' COMMENT '申请理由',
    `user_id`       INT UNSIGNED NOT NULL COMMENT '申请权限用户标识',
    `progroup_id`   INT UNSIGNED NOT NULL COMMENT '项目组标识',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '申请时间',

    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id` ASC),
    INDEX `idx_progroup_id` (`progroup_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='权限申请表';

# 权限申请操作表
CREATE TABLE `progroup_verification_op` (
    `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '操作记录标识',
    `role`              TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '如果操作为通过，则通过的角色标识\n\n0 － 观察者\n1 － 开发者\n2 － 测试员\n9 － 管理员\n',
    `result`            TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '操作结果\n\n0 - 未操作\n1 - 通过\n2 - 拒绝\n3 - 自动通过',
    `message`           VARCHAR(500) NOT NULL DEFAULT '' COMMENT '操作描述信息，（自动）通过的描述信息由程序组装',
    `user_id`           INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '操作人员标识',
    `verification_id`   INT UNSIGNED NOT NULL COMMENT '申请记录标识',
    `create_time`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '操作时间',

    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id` ASC),
    INDEX `idx_verification_id` (`verification_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='权限申请操作表';

# 项目组中的接口规范表
CREATE TABLE `progroup_api_spec` (
    `id`                           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '操作记录标识',
    `progroup_id`                  INT UNSIGNED NOT NULL COMMENT '项目组标识',
    `type`                         TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '接口类型标识\n\n0 - http接口\n1 - 函数接口 \n2 - rpc 接口',
    `path`                         VARCHAR(200) NOT NULL DEFAULT '' COMMENT '接口路径规范',
    `path_description`             VARCHAR(200) NOT NULL DEFAULT '' COMMENT '接口路径规范描述信息',
    `param`                        VARCHAR(200) NOT NULL DEFAULT '' COMMENT '接口参数规范',
    `param_description`            VARCHAR(200) NOT NULL DEFAULT '' COMMENT '接口参数规范的描述信息',
    `paramdesc`                    VARCHAR(200) NOT NULL DEFAULT '' COMMENT '接口参数描述规范',
    `paramdesc_description`        VARCHAR(200) NOT NULL DEFAULT '' COMMENT '接口参数描述规范的描述信息',
    `method`                       VARCHAR(200) NOT NULL DEFAULT '' COMMENT '接口请求方式规范',
    `method_description`           VARCHAR(200) NOT NULL DEFAULT '' COMMENT '接口请求方式规范描述信息',
    `tag`                          VARCHAR(200) NOT NULL DEFAULT '' COMMENT '接口标签规范',
    `tag_description`              VARCHAR(200) NOT NULL DEFAULT '' COMMENT '接口标签规范描述信息',
    `res_schema`                   TEXT COMMENT '响应结果数据格式 schema',
    `res_schema_description`       VARCHAR(200) NOT NULL DEFAULT '' COMMENT '响应结果数据格式 schema 描述信息',
    `interface_schema`             TEXT COMMENT '接口出入参数据格式 schema',
    `interface_schema_description` VARCHAR(200) NOT NULL DEFAULT '' COMMENT '接口出入参数据格式 schema',
    `create_time`                  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '操作时间',

    PRIMARY KEY (`id`),
    INDEX `idx_progroup_id` (`progroup_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='项目组中的接口规范表';

# 项目表
CREATE TABLE `project` (
    `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '项目标识',
    `type`              TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '项目类型标识\n\n0 - 常规项目\n1 - 共享资源\n2 - 隐藏项目',
    `logo`              VARCHAR(255) NOT NULL DEFAULT '' COMMENT '项目LOGO地址',
    `name`              VARCHAR(50) NOT NULL DEFAULT '' COMMENT '项目名称',
    `name_pinyin`       VARCHAR(255) NOT NULL DEFAULT '' COMMENT '项目名称拼音',
    `description`       VARCHAR(500) NOT NULL DEFAULT '' COMMENT '项目描述',
    `lob`               VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'line of business，该项目对应的业务线',
    `qbs_id`            BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '通过QBS系统绑定的项目标识',
    `progroup_id`       INT UNSIGNED NOT NULL COMMENT '归属项目组标识',
    `creator_id`        INT UNSIGNED NOT NULL COMMENT '项目创建者标识',
    `create_time`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '项目创建时间',
    `host_id`           INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '项目所使用的测试用例服务器配置id',
    `tool_key`          VARCHAR(32) NOT NULL DEFAULT '' COMMENT '工具使用密码',
    `tool_spec_web`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '项目使用WEB工程规范标识',
    `tool_spec_aos`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '项目使用的AOS工程规范标识',
    `tool_spec_ios`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '项目使用的IOS工程规范标识',
    `tool_spec_test`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '项目使用的测试工程规范标识',
    `auth_type`         TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '授权类型标识0 - key授权1 - cookie授权',
    `res_param_required` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '项目是否开启接口响应参数是否必需配置功能0 - 未开启\n1 - 开启',
    `use_word_stock` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否使用参数词库校验功能\n\n0 － 不开启\n1 － 开启',

    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_tool_key` (`tool_key` ASC),
    INDEX `idx_progroup_id` (`progroup_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='项目表';

# 命令行参数表
CREATE TABLE `arguments` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '参数标识',
  `type`            TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '归属类型，同规范类型定义\n\n0 - web工程\n1 - android工程\n2 - ios工程\n3 - 测试工程',
  `key`             VARCHAR(50) NOT NULL DEFAULT '' COMMENT '参数键',
  `value`           VARCHAR(50) NOT NULL DEFAULT '' COMMENT '参数值',
  `project_id`      INT UNSIGNED NOT NULL COMMENT '参数所在项目标识',
  `progroup_id`     INT UNSIGNED NOT NULL COMMENT '参数所在项目组标识',
  `creator_id`      INT UNSIGNED NOT NULL COMMENT '参数创建者标识',
  `create_time`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '参数创建时间',

  PRIMARY KEY (`id`),
  INDEX `idx_project_id` (`project_id` ASC),
  INDEX `idx_progroup_id` (`progroup_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='命令行参数列表';

# 视图表
CREATE TABLE `view` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '视图标识',
    `tag`           VARCHAR(50) NOT NULL DEFAULT '' COMMENT '视图标签',
    `tag_pinyin`    VARCHAR(255) NOT NULL DEFAULT '' COMMENT '视图标签拼音',
    `type`          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '视图类型\n\n0 － WEB视图\n1 － AOS视图\n2 － IOS视图',
    `path`          VARCHAR(150) NOT NULL DEFAULT '' COMMENT '视图访问路径',
    `name`          VARCHAR(50) NOT NULL DEFAULT '' COMMENT '视图名称',
    `name_pinyin`   VARCHAR(255) NOT NULL DEFAULT '' COMMENT '视图名称拼音',
    `description`   VARCHAR(10000) NOT NULL DEFAULT '' COMMENT '视图描述',
    `class_name`    VARCHAR(100) NOT NULL DEFAULT '' COMMENT '自动生成代码标记',
    `respo_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '负责人标识',
    `group_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '视图所在业务分组标识',
    `project_id`    INT UNSIGNED NOT NULL COMMENT '视图所在项目标识',
    `progroup_id`   INT UNSIGNED NOT NULL COMMENT '视图所在项目组标识',
    `creator_id`    INT UNSIGNED NOT NULL COMMENT '视图创建者标识',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '视图创建时间',

    PRIMARY KEY (`id`),
    INDEX `idx_project_id` (`project_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='视图表';

# 业务分组表
CREATE TABLE `bisgroup` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '业务分组标识',
    `type`          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '业务分组类型\n\n0 - 常规业务分组\n1 - 默认业务分组\n2 - 隐藏业务分组',
    `name`          VARCHAR(50) NOT NULL DEFAULT '' COMMENT '业务分组名称',
    `name_pinyin`   VARCHAR(255) NOT NULL DEFAULT '' COMMENT '业务分组名称拼音',
    `description`   VARCHAR(500) NOT NULL DEFAULT '' COMMENT '业务分组描述',
    `rpc_pom`       TEXT COMMENT 'RPC应用的POM依赖',
    `rpc_key`       TEXT COMMENT 'RPC应用的Key',
    `respo_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '负责人标识',
    `project_id`    INT UNSIGNED NOT NULL COMMENT '业务分组归属项目',
    `progroup_id`   INT UNSIGNED NOT NULL COMMENT '业务分组归属项目组',
    `creator_id`    INT UNSIGNED NOT NULL COMMENT '创建者标识',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',

    PRIMARY KEY (`id`),
    INDEX `idx_project_id` (`project_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='业务分组表';

# 数据模型表
CREATE TABLE `datatype` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '数据类型标识',
    `tag`           VARCHAR(50) NOT NULL DEFAULT '' COMMENT '标签',
    `tag_pinyin`    VARCHAR(255) NOT NULL DEFAULT '' COMMENT '标签拼音',
    `type`          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '数据类型形式\n\n0 － 普通类型，列表中可见\n1 － 系统预置类型，列表中置顶\n2 － 匿名类型，列表中不可见',
    `name`          VARCHAR(100) NOT NULL DEFAULT '' COMMENT '数据类型名称',
    `format`        TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '数据类型格式\n\n0 － 集合\n1 － 枚举\n2 － 数组\n3 － 字符\n4 － 数值\n5 － 布尔\n6 － 文件\n7 － 集合',
    `description`   VARCHAR(10000) NOT NULL DEFAULT '' COMMENT '数据类型描述',
    `group_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '业务分组标识',
    `project_id`    INT UNSIGNED NOT NULL COMMENT '归属项目标识',
    `progroup_id`   INT UNSIGNED NOT NULL COMMENT '归属项目组标识',
    `creator_id`    INT UNSIGNED NOT NULL COMMENT '创建者标识',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',

    PRIMARY KEY (`id`),
    INDEX `idx_project_id` (`project_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='数据模型表';

# 参数表
CREATE TABLE `parameter` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '参数标识',
  `type`            BIGINT UNSIGNED NOT NULL COMMENT '参数数据类型',
  `name`            VARCHAR(100) NOT NULL DEFAULT '' COMMENT '参数名称，枚举类型存的是代码变量名称',
  `is_array`        TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否数组\n\n0 － 非数组\n1 － 数组',
  `val_expression`  VARCHAR(255) NOT NULL DEFAULT '' COMMENT '字段验证表达式',
  `gen_expression`  VARCHAR(255) NOT NULL DEFAULT '' COMMENT '字段生成表达式',
  `description`     VARCHAR(10000) NOT NULL DEFAULT '' COMMENT '描述信息',
  `default_value`   VARCHAR(500) NOT NULL DEFAULT '' COMMENT '默认值，枚举类型存的是显示值',
  `parent_id`       BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '参数归属的资源标识，可以是数据类型、页面请求参数等',
  `parent_type`     TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '参数归属资源类型\n\n0 － 页面请求参数\n1 － 模板预填参数\n2 － 接口输入参数\n3 － 接口输出参数\n4 － 数据类型属性\n5 － 异步接口路径参数\n6－ RPC接口输入参数\n7 － RPC接口输出参数\n',
  `progroup_id`     INT UNSIGNED NOT NULL COMMENT '归属项目组标识',
  `required`        TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '是否必须\n\n0 － 非必需\n1 － 必需',
  `create_time`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `position`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序位置',

  PRIMARY KEY (`id`),
  INDEX `idx_parent` (`parent_id` ASC, `parent_type` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='参数表';

# 参数导入表
CREATE TABLE `parameter_combination` (
  `parent_id`       BIGINT UNSIGNED NOT NULL COMMENT '参数归属资源标识',
  `parent_type`     TINYINT UNSIGNED NOT NULL COMMENT '参数归属资源类型\n\n0 － 页面请求参数\n1 － 模板预填参数\n2 － 接口输入参数\n3 － 接口输出参数\n4 － 数据类型属性\n5 － 异步接口路径参数\n6－ RPC接口输入参数\n7 － RPC接口输出参数\n',
  `datatype_id`     BIGINT UNSIGNED NOT NULL COMMENT '导入的数据类型标识',
  `progroup_id`     INT UNSIGNED NOT NULL COMMENT '归属项目组标识',
  `create_time`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '数据类型导入时间',
  `position`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序位置',

  PRIMARY KEY (`parent_id`, `parent_type`, `datatype_id`)
)
ENGINE=InnoDB COMMENT='参数组合关系表';

# 参数重写表
CREATE TABLE `parameter_overwrite` (
  `parent_id`       BIGINT UNSIGNED NOT NULL COMMENT '参数归属的资源标识',
  `parent_type`     TINYINT UNSIGNED NOT NULL COMMENT '参数归属的资源类型\n\n0 － 页面请求参数\n1 － 模板预填参数\n2 － 接口输入参数\n3 － 接口输出参数\n4 － 数据类型属性\n5 － 异步接口路径参数\n6－ RPC接口输入参数\n7 － RPC接口输出参数\n',
  `datatype_id`     BIGINT UNSIGNED NOT NULL COMMENT '导入的数据类型标识',
  `parameter_id`    BIGINT UNSIGNED NOT NULL COMMENT '参数标识',
  `progroup_id`     INT UNSIGNED NOT NULL COMMENT '归属项目组标识',
  `type`            BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '重写的数据类型',
  `is_array`        TINYINT UNSIGNED NOT NULL DEFAULT 9 COMMENT '是否数组格式\n\n0 － 非数组\n1 － 数组\n9 － 未设置',
  `val_expression`  VARCHAR(255) NOT NULL DEFAULT '' COMMENT '字段验证表达式',
  `gen_expression`  VARCHAR(255) NOT NULL DEFAULT '' COMMENT '字段生成表达式',
  `description`     VARCHAR(10000) NOT NULL DEFAULT '' COMMENT '重写的描述信息',
  `default_value`   VARCHAR(500) NOT NULL DEFAULT '' COMMENT '重写的默认值',
  `required`        TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '是否必须\n\n0 － 非必需\n1 － 必需',
  `ignored`         TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否忽略\n\n0 － 非忽略\n1 － 忽略',
  `create_time`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '重写时间',

  PRIMARY KEY (`parent_id`, `parent_type`, `datatype_id`, `parameter_id`)
)
ENGINE=InnoDB COMMENT='参数重写信息表';

# 约束函数
CREATE TABLE `constraint` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '约束函数标识',
    `tag`           VARCHAR(50) NOT NULL DEFAULT '' COMMENT '标签',
    `tag_pinyin`    VARCHAR(255) NOT NULL DEFAULT '' COMMENT '标签拼音',
    `type`          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '函数类型\n\n0 － 用户定义\n1 － 系统预置',
    `name`          VARCHAR(100) NOT NULL DEFAULT '' COMMENT '函数名称',
    `apply`         BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '适用类型，0表示适用于所有类型\n',
    `function`      TEXT COMMENT '函数执行体',
    `description`   VARCHAR(1000) NOT NULL DEFAULT '' COMMENT '描述信息',
    `group_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '所属业务分组',
    `project_id`    INT UNSIGNED NOT NULL COMMENT '归属项目',
    `progroup_id`   INT UNSIGNED NOT NULL COMMENT '归属项目分组',
    `creator_id`    INT UNSIGNED NOT NULL COMMENT '创建者标识',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',

    PRIMARY KEY (`id`),
    INDEX `idx_project_id` (`project_id` ASC),
    INDEX `idx_progroup_id` (`progroup_id` ASC),
    INDEX `idx_creator_id` (`creator_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='约束函数表';

# 视图模板表
CREATE TABLE `template` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '模板标识',
    `tag`           VARCHAR(50) NOT NULL DEFAULT '' COMMENT '标签',
    `tag_pinyin`    VARCHAR(255) NOT NULL DEFAULT '' COMMENT '标签拼音',
    `path`          VARCHAR(150) NOT NULL DEFAULT '' COMMENT '模板路径',
    `name`          VARCHAR(100) NOT NULL DEFAULT '' COMMENT '模板名称',
    `name_pinyin`   VARCHAR(255) NOT NULL DEFAULT '' COMMENT '模板名称拼音',
    `status`        VARCHAR(30) NOT NULL DEFAULT '' COMMENT '页面模板状态信息',
    `status_pinyin` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '页面模板状态信息拼音',
    `description`   VARCHAR(2000) NOT NULL DEFAULT '' COMMENT '模板描述',
    `respo_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '负责人标识',
    `group_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '归属业务分组标识',
    `project_id`    INT UNSIGNED NOT NULL COMMENT '归属项目标识',
    `progroup_id`   INT UNSIGNED NOT NULL COMMENT '归属项目组标识',
    `creator_id`    INT UNSIGNED NOT NULL COMMENT '创建者标识',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',

    PRIMARY KEY (`id`),
    INDEX `idx_project_id` (`project_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='页面模板表';

# 接口表
CREATE TABLE `interface` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '接口标识',
    `tag`           VARCHAR(50) NOT NULL DEFAULT '' COMMENT '接口标签',
    `tag_pinyin`    VARCHAR(255) NOT NULL DEFAULT '' COMMENT '标签拼音',
    `name`          VARCHAR(100) NOT NULL DEFAULT '' COMMENT '接口名称',
    `name_pinyin`   VARCHAR(255) NOT NULL DEFAULT '' COMMENT '接口名称拼音',
    `status`        VARCHAR(30) NOT NULL DEFAULT '' COMMENT '接口状态信息',
    `status_pinyin` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '接口状态信息拼音',
    `path`          VARCHAR(150) NOT NULL DEFAULT '' COMMENT '请求路径',
    `type`          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '接口类型\n\n0 － 异步接口\n1 － 函数接口\n2 － rpc接口',
    `method`        VARCHAR(10) NOT NULL DEFAULT '' COMMENT '请求方式，全大写字母',
    `is_rest`       TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否REST风格\n\n0 － 非REST风格\n1 － REST风格',
    `class_name`    VARCHAR(500) NOT NULL DEFAULT '' COMMENT '自动生成代码标记',
    `description`   VARCHAR(10000) NOT NULL DEFAULT '' COMMENT '接口描述',
    `params_order`  VARCHAR(1000) NOT NULL DEFAULT '' COMMENT '对于非异步接口，此字段保存参数顺序',
    `respo_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '负责人标识',
    `group_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '业务分组标识',
    `project_id`    INT UNSIGNED NOT NULL COMMENT '归属项目标识',
    `progroup_id`   INT UNSIGNED NOT NULL COMMENT '归属项目组标识',
    `creator_id`    INT UNSIGNED NOT NULL COMMENT '创建者标识',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    `before_script` TEXT COMMENT '接口测试，发送前的处理脚本',
    `after_script`  TEXT COMMENT '接口测试，接收数据后的处理脚本',
    `req_format`    TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '输入参数格式\n\n0 － 集合\n1 － 枚举\n2 － 数组\n3 － 字符\n4 － 数值\n5 － 布尔\n6 － 文件',
    `res_format`    TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '输出参数格式\n\n0 － 集合\n1 － 枚举\n2 － 数组\n3 － 字符\n4 － 数值\n5 － 布尔\n6 － 文件',
    `blb_script`    TEXT COMMENT 'businessLogicBeforeScript，mockstore 前置业务逻辑脚本，是规则函数',
    `bla_script`    TEXT COMMENT 'businessLogicAfterScript，mockstore 后置业务逻辑脚本，是规则函数',
    `connect_id`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '关联的数据模型id',
    `connect_type`  TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '关联的数据模型类型\n\n0 － 未设置\n1 － 按id加载单个\n2 － 加载所有\n3 - 按id列表加载多个\n4 - 创建单个\n5 - 按数组数据创建多个\n6 - 更新单个\n7 - 更新所有\n8 - 按id列表更新多个\n9 - 按id删除单个\n10 - 删除所有\n11 - 按id列表删除多个',
    `status_id`     int(10) unsigned NOT NULL DEFAULT '9994',
    `mock_delay`    int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'mock api 请求的延时时间',
    `schema`        VARCHAR(300) NOT NULL DEFAULT '' COMMENT '接口规范',

    PRIMARY KEY (`id`),
    INDEX `idx_project_id` (`project_id` ASC),
    INDEX `idx_connect_id` (`connect_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='接口表';

# 接口头信息表
CREATE TABLE `interface_header` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '头标识',
    `name`            VARCHAR(150) NOT NULL DEFAULT '' COMMENT '头字段名称',
    `parent_id`       BIGINT UNSIGNED NOT NULL COMMENT '头字段归属的接口标识',
    `parent_type`     TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '头类型\n\n0 － 请求头\n1 － 响应头',
    `default_value`   VARCHAR(255) NOT NULL DEFAULT '' COMMENT '字段值',
    `description`     VARCHAR(10000) NOT NULL DEFAULT '' COMMENT '字段描述信息',
    `progroup_id`     INT UNSIGNED NOT NULL COMMENT '归属的项目组标识',
    `create_time`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    `position`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序位置',

    PRIMARY KEY (`id`),
    INDEX `idx_interface_id` (`parent_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='请求头信息表';

# 接口头信息导入表
CREATE TABLE `interface_header_combination` (
    `parent_id`       BIGINT UNSIGNED NOT NULL COMMENT '接口标识',
    `parent_type`     TINYINT UNSIGNED NOT NULL COMMENT '头类型\n\n0 － 请求头\n1 － 响应头',
    `datatype_id`     BIGINT UNSIGNED NOT NULL COMMENT '导入的数据类型标识',
    `progroup_id`     INT UNSIGNED NOT NULL COMMENT '归属项目组标识',
    `create_time`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `position`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序位置',

    PRIMARY KEY (`parent_id`, `datatype_id`, `parent_type`),
    INDEX `idx_datatype_id` (`datatype_id` ASC),
    INDEX `idx_progroup_id` (`progroup_id` ASC)
)
ENGINE=InnoDB COMMENT='接口头信息导入的数据类型表';

# 接口头信息重写表
CREATE TABLE `interface_header_overwrite` (
    `parent_id`       BIGINT UNSIGNED NOT NULL COMMENT '接口标识',
    `parent_type`     TINYINT UNSIGNED NOT NULL COMMENT '头类型\n\n0 － 请求头\n1 － 响应头',
    `datatype_id`     BIGINT UNSIGNED NOT NULL COMMENT '导入的数据类型标识',
    `parameter_id`    BIGINT UNSIGNED NOT NULL COMMENT '导入的属性标识',
    `progroup_id`     INT UNSIGNED NOT NULL COMMENT '归属项目组标识',
    `default_value`   VARCHAR(255) NOT NULL DEFAULT '' COMMENT '重写的属性值',
    `ignored`         TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否忽略\n\n0 － 非忽略\n1 － 忽略',
    `description`     VARCHAR(500) NOT NULL DEFAULT '' COMMENT '重写的描述信息',
    `create_time`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '重写时间',

    PRIMARY KEY (`parent_type`, `parent_id`, `datatype_id`, `parameter_id`),
    INDEX `idx_interface_id` (`parent_id` ASC),
    INDEX `idx_datatype_id` (`datatype_id` ASC),
    INDEX `idx_parameter_id` (`parameter_id` ASC),
    INDEX `idx_progroup_id` (`progroup_id` ASC)
)
ENGINE=InnoDB COMMENT='接口导入头信息重写表';

# 接口测试用例表
CREATE TABLE `interface_testcase` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '测试用例标识',
    `interface_id`    BIGINT UNSIGNED NOT NULL COMMENT '用例归属接口标识',
    `progroup_id`     INT UNSIGNED NOT NULL COMMENT '归属项目组标识',
    `host`            VARCHAR(50) NOT NULL DEFAULT '' COMMENT '测试服务器地址',
    `state`           TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '测试用例执行状态\n\n0 - 未测试\n1 - 测试通过\n2 - 测试失败',
    `name`            VARCHAR(100) NOT NULL DEFAULT '' COMMENT '测试名称',
    `description`     VARCHAR(500) NOT NULL DEFAULT '' COMMENT '测试描述信息',
    `creator_id`      INT UNSIGNED NOT NULL COMMENT '测试用例创建者标识',
    `create_time`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '测试用例创建时间',
    `tester_id`       INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '测试执行者标识',
    `test_beg_time`   BIGINT NOT NULL DEFAULT 0 COMMENT '测试开始时间',
    `test_end_time`   BIGINT NOT NULL DEFAULT 0 COMMENT '测试结束时间',
    `req_header`      TEXT NULL COMMENT '接口请求头，JSON串',
    `req_data`        TEXT NULL COMMENT '接口请求消息体',
    `res_header`      TEXT NULL COMMENT '接口响应头，JSON串',
    `res_expect`      TEXT NULL COMMENT '接口的预期响应消息体，JSON串',
    `res_expect_header` TEXT NULL COMMENT '接口的预期响应消息头信息，JSON串',
    `res_data`        MEDIUMTEXT NULL COMMENT '接口响应消息体',
    `report`          TEXT NULL COMMENT '用例运行后结果报告',

    PRIMARY KEY (`id`),
    INDEX `idx_interface_id` (`interface_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='接口测试用例数据表';

# 接口测试用例服务器表
CREATE TABLE `interface_testcase_host` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '测试用例标识',
    `project_id`      INT UNSIGNED NOT NULL COMMENT '归属项目标识',
    `progroup_id`     INT UNSIGNED NOT NULL COMMENT '归属项目组标识',
    `name`            VARCHAR(500) NOT NULL DEFAULT '' COMMENT '测试服务器名称',
    `value`           VARCHAR(500) NOT NULL DEFAULT '' COMMENT '测试服务器地址',
    `header`          VARCHAR(1000) NOT NULL DEFAULT '' COMMENT '发送给测试服务器的请求头',
    `creator_id`      INT UNSIGNED NOT NULL COMMENT '创建者标识',
    `create_time`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',

    PRIMARY KEY (`id`),
    INDEX `idx_project_id` (`project_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='接口测试用例服务器表';

# 测试集
CREATE TABLE `testcase_collection` (
    `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '测试集标识',
    `host`                  VARCHAR(500) NOT NULL DEFAULT '' COMMENT '测试集服务器地址',
    `name`                  VARCHAR(100) NOT NULL DEFAULT '' COMMENT '测试集名称',
    `name_pinyin`           VARCHAR(255) NOT NULL DEFAULT '' COMMENT '测试集名称拼音',
    `project_id`            INT UNSIGNED NOT NULL COMMENT '归属项目标识',
    `progroup_id`           INT UNSIGNED NOT NULL COMMENT '归属项目组标识',
    `description`           VARCHAR(500) NOT NULL DEFAULT '' COMMENT '测试集描述信息',
    `data`                  VARCHAR(2000) NOT NULL DEFAULT '' COMMENT '测试集接口排序信息或者是依赖测试集的层信息',
    `type`                  TINYINT UNSIGNED NOT NULL COMMENT '接口测试集类型\n\n0 － 普通测试集\n1 － 依赖测试集',
    `creator_id`            INT UNSIGNED NOT NULL COMMENT '测试集创建者标识',
    `create_time`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '测试集创建时间',

    PRIMARY KEY (`id`)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='测试集记录表';

# 测试集接口跟测试用例关联表
CREATE TABLE `collection_interface_testcase` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '测试集标识',
    `collection_id` BIGINT UNSIGNED NOT NULL COMMENT '测试集记录标识',
    `interface_id`  BIGINT UNSIGNED NOT NULL COMMENT '接口标识',
    `testcase_id`   BIGINT UNSIGNED NOT NULL COMMENT '测试用例标识',

    PRIMARY KEY (`id`)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='测试集接口跟测试用例关联表';

# 页面视图-页面模板关系表
CREATE TABLE `view_template` (
    `view_id`       BIGINT UNSIGNED NOT NULL COMMENT '页面标识',
    `template_id`   BIGINT UNSIGNED NOT NULL COMMENT '模板标识',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',

    PRIMARY KEY (`view_id`, `template_id`)
)
ENGINE=InnoDB COMMENT='页面视图－页面模板关系表';

# 页面视图-接口关系表
CREATE TABLE `view_interface` (
    `view_id`       BIGINT UNSIGNED NOT NULL COMMENT '页面视图标识',
    `interface_id`  BIGINT UNSIGNED NOT NULL COMMENT '接口标识',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '添加时间',

    PRIMARY KEY (`view_id`, `interface_id`)
)
ENGINE=InnoDB COMMENT='页面视图－接口关系表';

# 资源操作历史
CREATE TABLE `resource_history` (
    `id`            BIGINT NOT NULL AUTO_INCREMENT COMMENT '操作记录标识',
    `user_id`       INT UNSIGNED NOT NULL COMMENT '操作用户标识',
    `project_id`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '资源归属项目ID',
    `progroup_id`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '资源归属项目组标识',
    `res_id`        BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '操作资源标识',
    `res_type`      TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '资源类型',
    `op_data`       TEXT NULL COMMENT '操作信息需要保存的冗余信息，JSON字符串',
    `op_action`     TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '操作标识\n\n1 － 增加\n2 － 删除\n3 － 修改\n4 －共享\n5 －关注',
    `op_content`    VARCHAR(5000) NOT NULL DEFAULT '' COMMENT '操作内容',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '操作时间',

    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id` ASC),
    INDEX `idx_project_id` (`project_id` ASC),
    INDEX `idx_progroup_id` (`progroup_id` ASC),
    INDEX `idx_resource` (`res_type` ASC, `res_id` ASC),
    INDEX `idx_create_time` (`create_time` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='资源操作历史';

# 资源查看历史
CREATE TABLE `resource_view_history` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '标识',
    `user_id`       INT UNSIGNED NOT NULL COMMENT '查看用户标识',
    `project_id`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '资源归属项目ID',
    `progroup_id`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '资源归属项目组标识',
    `res_id`        BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '查看资源标识',
    `res_type`      TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '资源类型',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '查看时间',

    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id` ASC),
    INDEX `idx_project_id` (`project_id` ASC),
    INDEX `idx_progroup_id` (`progroup_id` ASC),
    INDEX `idx_resource` (`res_type` ASC, `res_id` ASC),
    INDEX `idx_create_time` (`create_time` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='资源查看历史';

# 项目组ip
CREATE TABLE `progroup_ip` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '项目组ip标识',
    `progroup_id`            BIGINT UNSIGNED NOT NULL COMMENT '项目组标识',
    `ip`       VARCHAR(50) NOT NULL DEFAULT '' COMMENT '登录IP',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',

    PRIMARY KEY (`id`)
)
ENGINE=InnoDB COMMENT='项目组ip';

# 资源关注表
CREATE TABLE `resource_watch` (
    `id`          BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `res_id`      BIGINT(20) UNSIGNED NOT NULL DEFAULT '0' COMMENT '资源标识',
    `res_type`    TINYINT(3) UNSIGNED NOT NULL DEFAULT '0' COMMENT '资源类型',
    `project_id`  INT(10) NOT NULL COMMENT '项目标识',
    `progroup_id` INT(10) NOT NULL COMMENT '项目组标识',
    `user_id`     INT(10) NOT NULL COMMENT '用户标识',
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',

    PRIMARY KEY (`id`)
)
ENGINE=InnoDB AUTO_INCREMENT=156;

# 资源版本信息表
CREATE TABLE `resource_version` (
    `id`          BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `res_id`      BIGINT(20) UNSIGNED NOT NULL DEFAULT 0 COMMENT '资源标识',
    `res_type`    TINYINT(3) UNSIGNED NOT NULL DEFAULT 0 COMMENT '资源类型',
    `project_id`  INT(10) NOT NULL COMMENT '项目标识',
    `progroup_id` INT(10) NOT NULL COMMENT '项目组标识',
    `origin`      BIGINT(20) UNSIGNED NOT NULL DEFAULT 0 COMMENT '源资源标识',
    `parent`      BIGINT(20) NOT NULL DEFAULT 0 COMMENT '父资源标识',
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    `creator_id`  INT UNSIGNED NOT NULL COMMENT '创建者标识',
    `description` VARCHAR(500) NOT NULL DEFAULT '' COMMENT '历史版本描述信息',
    `name`     VARCHAR(500) NOT NULL DEFAULT '' COMMENT '历史版本名称',

    PRIMARY KEY (`id`),
    INDEX `idx_res` (`res_id` ASC, `res_type` ASC, `origin` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000;

# 客户端资源关联表
CREATE TABLE `resource_client` (
    `res_id`      BIGINT(20) UNSIGNED NOT NULL DEFAULT '0' COMMENT '资源标识',
    `res_type`    TINYINT(3) UNSIGNED NOT NULL DEFAULT '0' COMMENT '资源类型',
    `project_id`  INT(10) NOT NULL COMMENT '项目标识',
    `progroup_id` INT(10) NOT NULL COMMENT '项目组标识',
    `client_id`   INT(10) NOT NULL COMMENT '客户端标识',
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',

    PRIMARY KEY (`res_id`, `res_type`, `client_id`),
    INDEX `idx_res` (`res_id` ASC, `res_type` ASC)
)
ENGINE=InnoDB;

# 客户端
CREATE TABLE `client` (
    `id`            BIGINT NOT NULL AUTO_INCREMENT COMMENT '客户端标识',
    `name`          VARCHAR(255) NOT NULL DEFAULT '' COMMENT '客户端版本名称',
    `name_pinyin`   VARCHAR(255) NOT NULL DEFAULT '' COMMENT '客户端版本名称拼音',
    `tag`           VARCHAR(50) NOT NULL DEFAULT '' COMMENT '客户端标签',
    `tag_pinyin`    VARCHAR(255) NOT NULL DEFAULT '' COMMENT '标签拼音',
    `respo_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '负责人标识',
    `description`   VARCHAR(500) NOT NULL DEFAULT '' COMMENT '客户端描述信息',
    `group_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '所属业务分组',
    `download_link` VARCHAR(1000) NOT NULL DEFAULT '' COMMENT '客户端下载链接',
    `launch_date`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '上线日期',
    `close_date`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '下线日期',
    `project_id`    INT UNSIGNED NOT NULL COMMENT '归属项目标识',
    `progroup_id`   INT UNSIGNED NOT NULL COMMENT '归属项目组标识',
    `creator_id`    INT UNSIGNED NOT NULL COMMENT '客户端创建者标识',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '客户端创建时间',
    `version`       VARCHAR(500) NOT NULL DEFAULT '' COMMENT '版本名称',

    PRIMARY KEY (`id`),
    INDEX `idx_project_id` (`project_id` ASC),
    INDEX `idx_progroup_id` (`progroup_id` ASC)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='客户端';

# 初始化系统数据
INSERT INTO `user`
    (id, username, email, email_state, realname, realname_pinyin, `from`, company, role)
VALUES
    (10000, "admin", "nei@mycompany.com", 1, "系统管理员", "xi'tong'guan'li'yuan", 1, "", 2);

INSERT INTO progroup
    (id, type, name, name_pinyin, description, creator_id)
VALUES
    (10000, 2, "隐藏项目分组", "", "系统内置隐藏分组", 10000);

INSERT INTO project
    (id, type, name, name_pinyin, description, progroup_id, creator_id)
VALUES
    (10000, 2, "隐藏项目", "", "系统内置隐藏项目", 10000, 10000);

INSERT INTO bisgroup
    (id, type, name, name_pinyin, description, respo_id, progroup_id, project_id, creator_id)
VALUES
    (9999, 2, "系统业务分组", "xi'tong'ye'wu'fen'zu", "系统内置业务分组", 10000, 10000, 10000, 10000);

INSERT INTO datatype
    (id, tag, tag_pinyin, type, name, format, description, project_id, progroup_id, creator_id, group_id)
VALUES
    ( 9998, "系统类型", "xi'tong'lei'xing", 2, "UNKNOWN",  0, "未知类型", 10000, 10000, 10000, 9999),
    ( 9999, "系统类型", "xi'tong'lei'xing", 1, "File",     6, "文件类型", 10000, 10000, 10000, 9999),
    (10000, "系统类型", "xi'tong'lei'xing", 1, "Variable", 0, "可变类型", 10000, 10000, 10000, 9999),
    (10001, "系统类型", "xi'tong'lei'xing", 1, "String",   3, "字符串",   10000, 10000, 10000, 9999),
    (10002, "系统类型", "xi'tong'lei'xing", 1, "Number",   4, "数值",     10000, 10000, 10000, 9999),
    (10003, "系统类型", "xi'tong'lei'xing", 1, "Boolean",  5, "布尔",     10000, 10000, 10000, 9999);

INSERT INTO specification
    (id, type, is_share, name, name_pinyin, language, description, creator_id)
VALUES
    (10000, 0, 0, "系统内置MAVEN工程规范", "xi'tong'nei'zhi'MAVEN'gong'cheng'gui'fan", 11, "系统内置MAVEN工程规范", 10000),
    (10001, 0, 0, "系统内置NODE工程规范", "xi'tong'nei'zhi'NODE'gong'cheng'gui'fan", 12, "系统内置NODE工程规范", 10000);


# 调用 apimock 接口的记录表
CREATE TABLE `call_apimock` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '标识',
    `interface_id`  BIGINT UNSIGNED NOT NULL COMMENT '调用的接口标识',
    `ip`            VARCHAR(50) NOT NULL DEFAULT '' COMMENT '调用者IP',
    `address`       VARCHAR(255) NOT NULL DEFAULT '' COMMENT '调用者地址',
    `call_time`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '调用时间',

    PRIMARY KEY (`id`)
)
ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='调用 apimock 接口的记录表';


CREATE TABLE `status` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '状态实体标识',
  `type` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '状态实体类型\n\n0 - 常规状态实体\n1 - 系统内置状态实体',
  `name` varchar(50) NOT NULL DEFAULT '' COMMENT '状态实体名称',
  `name_pinyin` varchar(255) NOT NULL DEFAULT '' COMMENT '状态实体名称拼音',
  `description` varchar(500) NOT NULL DEFAULT '' COMMENT '状态实体描述信息',
  `progroup_id` int(10) unsigned NOT NULL COMMENT '状态实体归属项目组',
  `creator_id` int(10) unsigned NOT NULL COMMENT '创建者标识',
  `create_time` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10001 COMMENT='状态实体表';

INSERT INTO `status` (`id`,`type`,`name`,`name_pinyin`,`description`,`progroup_id`,`creator_id`)
VALUES
    ( 9994,1,'未开始','wei\'kai\'shi','系统内置状态实体',10000,10000),
    ( 9995,1,'审核中','shen\'he\'zhong','系统内置状态实体',10000,10000),
    ( 9996,1,'开发中','kai\'fa\'zhong','系统内置状态实体',10000,10000),
    ( 9997,1,'测试中','ce\'shi\'zhong','系统内置状态实体',10000,10000),
    ( 9998,1,'已发布','yi\'fa\'bu','系统内置状态实体',10000,10000),
    ( 9999,1,'已废弃','yi\'fei\'qi','系统内置状态实体',10000,10000),
    (10000,1,'审核失败',"shen\'he\'shi\'bai","系统内置状态实体",10000,10000);

CREATE TABLE `word` (
    `id`int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '词条标识',
    `tag`           VARCHAR(50) NOT NULL DEFAULT '' COMMENT '标签',
    `tag_pinyin`    VARCHAR(255) NOT NULL DEFAULT '' COMMENT '标签拼音',
    `type`          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '词条类型\n\n0 － 用户定义\n1 － 系统预置',
    `name`          VARCHAR(100) NOT NULL DEFAULT '' COMMENT '词条名称',
    `description`   VARCHAR(1000) NOT NULL DEFAULT '' COMMENT '描述信息',
    `associated_word`   VARCHAR(1000) NOT NULL DEFAULT '' COMMENT '联想词',
    `group_id`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '所属业务分组',
    `project_id`    INT UNSIGNED NOT NULL COMMENT '归属项目',
    `progroup_id`   INT UNSIGNED NOT NULL COMMENT '归属项目分组',
    `creator_id`    INT UNSIGNED NOT NULL COMMENT '创建者标识',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',

    PRIMARY KEY (`id`),
    INDEX `idx_project_id` (`project_id` ASC),
    INDEX `idx_progroup_id` (`progroup_id` ASC),
    INDEX `idx_creator_id` (`creator_id` ASC)
) ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='参数字典表';

INSERT INTO `word`
    (`id`, `tag`, `tag_pinyin`, `type`, `name`, `description`, `associated_word`, `group_id`, `project_id`, `progroup_id`, `creator_id`)
VALUES
    (9000, "系统类型", "xi'tong'lei'xing", 1, "account", "", "", 9999, 10000, 10000, 10000),
    (9001, "系统类型", "xi'tong'lei'xing", 1, "accountId", "", "", 9999, 10000, 10000, 10000),
    (9002, "系统类型", "xi'tong'lei'xing", 1, "accountName", "", "", 9999, 10000, 10000, 10000),
    (9003, "系统类型", "xi'tong'lei'xing", 1, "address", "", "", 9999, 10000, 10000, 10000),
    (9004, "系统类型", "xi'tong'lei'xing", 1, "age", "", "", 9999, 10000, 10000, 10000),
    (9005, "系统类型", "xi'tong'lei'xing", 1, "avatar", "", "", 9999, 10000, 10000, 10000),
    (9006, "系统类型", "xi'tong'lei'xing", 1, "avatarUrl", "", "", 9999, 10000, 10000, 10000),
    (9007, "系统类型", "xi'tong'lei'xing", 1, "beginDate", "", "", 9999, 10000, 10000, 10000),
    (9008, "系统类型", "xi'tong'lei'xing", 1, "beginTime", "", "", 9999, 10000, 10000, 10000),
    (9009, "系统类型", "xi'tong'lei'xing", 1, "birthday", "", "", 9999, 10000, 10000, 10000),
    (9010, "系统类型", "xi'tong'lei'xing", 1, "code", "", "", 9999, 10000, 10000, 10000),
    (9011, "系统类型", "xi'tong'lei'xing", 1, "count", "", "", 9999, 10000, 10000, 10000),
    (9012, "系统类型", "xi'tong'lei'xing", 1, "createDate", "", "", 9999, 10000, 10000, 10000),
    (9013, "系统类型", "xi'tong'lei'xing", 1, "createTime", "", "", 9999, 10000, 10000, 10000),
    (9014, "系统类型", "xi'tong'lei'xing", 1, "creator", "", "", 9999, 10000, 10000, 10000),
    (9015, "系统类型", "xi'tong'lei'xing", 1, "creatorId", "", "", 9999, 10000, 10000, 10000),
    (9016, "系统类型", "xi'tong'lei'xing", 1, "creatorName", "", "", 9999, 10000, 10000, 10000),
    (9017, "系统类型", "xi'tong'lei'xing", 1, "data", "", "", 9999, 10000, 10000, 10000),
    (9018, "系统类型", "xi'tong'lei'xing", 1, "description", "", "", 9999, 10000, 10000, 10000),
    (9019, "系统类型", "xi'tong'lei'xing", 1, "email", "", "", 9999, 10000, 10000, 10000),
    (9020, "系统类型", "xi'tong'lei'xing", 1, "endDate", "", "", 9999, 10000, 10000, 10000),
    (9021, "系统类型", "xi'tong'lei'xing", 1, "endTime", "", "", 9999, 10000, 10000, 10000),
    (9022, "系统类型", "xi'tong'lei'xing", 1, "from", "", "", 9999, 10000, 10000, 10000),
    (9023, "系统类型", "xi'tong'lei'xing", 1, "gender", "", "", 9999, 10000, 10000, 10000),
    (9024, "系统类型", "xi'tong'lei'xing", 1, "id", "", "", 9999, 10000, 10000, 10000),
    (9025, "系统类型", "xi'tong'lei'xing", 1, "image", "", "", 9999, 10000, 10000, 10000),
    (9026, "系统类型", "xi'tong'lei'xing", 1, "imageUrl", "", "", 9999, 10000, 10000, 10000),
    (9027, "系统类型", "xi'tong'lei'xing", 1, "list", "", "", 9999, 10000, 10000, 10000),
    (9028, "系统类型", "xi'tong'lei'xing", 1, "logo", "", "", 9999, 10000, 10000, 10000),
    (9029, "系统类型", "xi'tong'lei'xing", 1, "member", "", "", 9999, 10000, 10000, 10000),
    (9030, "系统类型", "xi'tong'lei'xing", 1, "memberId", "", "", 9999, 10000, 10000, 10000),
    (9031, "系统类型", "xi'tong'lei'xing", 1, "message", "", "", 9999, 10000, 10000, 10000),
    (9032, "系统类型", "xi'tong'lei'xing", 1, "mobile", "", "", 9999, 10000, 10000, 10000),
    (9033, "系统类型", "xi'tong'lei'xing", 1, "name", "", "", 9999, 10000, 10000, 10000),
    (9034, "系统类型", "xi'tong'lei'xing", 1, "nickname", "", "", 9999, 10000, 10000, 10000),
    (9035, "系统类型", "xi'tong'lei'xing", 1, "number", "", "", 9999, 10000, 10000, 10000),
    (9036, "系统类型", "xi'tong'lei'xing", 1, "page", "", "", 9999, 10000, 10000, 10000),
    (9037, "系统类型", "xi'tong'lei'xing", 1, "pagination", "", "", 9999, 10000, 10000, 10000),
    (9038, "系统类型", "xi'tong'lei'xing", 1, "password", "", "", 9999, 10000, 10000, 10000),
    (9039, "系统类型", "xi'tong'lei'xing", 1, "phone", "", "", 9999, 10000, 10000, 10000),
    (9040, "系统类型", "xi'tong'lei'xing", 1, "record", "", "", 9999, 10000, 10000, 10000),
    (9041, "系统类型", "xi'tong'lei'xing", 1, "required", "", "", 9999, 10000, 10000, 10000),
    (9042, "系统类型", "xi'tong'lei'xing", 1, "result", "", "", 9999, 10000, 10000, 10000),
    (9043, "系统类型", "xi'tong'lei'xing", 1, "size", "", "", 9999, 10000, 10000, 10000),
    (9044, "系统类型", "xi'tong'lei'xing", 1, "startDate", "", "", 9999, 10000, 10000, 10000),
    (9045, "系统类型", "xi'tong'lei'xing", 1, "startTime", "", "", 9999, 10000, 10000, 10000),
    (9046, "系统类型", "xi'tong'lei'xing", 1, "status", "", "", 9999, 10000, 10000, 10000),
    (9047, "系统类型", "xi'tong'lei'xing", 1, "success", "", "", 9999, 10000, 10000, 10000),
    (9048, "系统类型", "xi'tong'lei'xing", 1, "telephone", "", "", 9999, 10000, 10000, 10000),
    (9049, "系统类型", "xi'tong'lei'xing", 1, "time", "", "", 9999, 10000, 10000, 10000),
    (9050, "系统类型", "xi'tong'lei'xing", 1, "timestamp", "", "", 9999, 10000, 10000, 10000),
    (9051, "系统类型", "xi'tong'lei'xing", 1, "title", "", "", 9999, 10000, 10000, 10000),
    (9052, "系统类型", "xi'tong'lei'xing", 1, "total", "", "", 9999, 10000, 10000, 10000),
    (9053, "系统类型", "xi'tong'lei'xing", 1, "type", "", "", 9999, 10000, 10000, 10000),
    (9054, "系统类型", "xi'tong'lei'xing", 1, "updateTime", "", "", 9999, 10000, 10000, 10000),
    (9055, "系统类型", "xi'tong'lei'xing", 1, "url", "", "", 9999, 10000, 10000, 10000),
    (9056, "系统类型", "xi'tong'lei'xing", 1, "user", "", "", 9999, 10000, 10000, 10000),
    (9057, "系统类型", "xi'tong'lei'xing", 1, "userId", "", "", 9999, 10000, 10000, 10000),
    (9058, "系统类型", "xi'tong'lei'xing", 1, "userName", "", "", 9999, 10000, 10000, 10000),
    (9059, "系统类型", "xi'tong'lei'xing", 1, "value", "", "", 9999, 10000, 10000, 10000);

CREATE TABLE `word_overwrite` (
    `project_id`    INT UNSIGNED NOT NULL COMMENT '归属项目',
    `progroup_id`   INT UNSIGNED NOT NULL COMMENT '归属项目分组',
    `word_id`       INT UNSIGNED NOT NULL COMMENT '词条',
    `forbid`       TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否禁用\n\n0 － 非禁用\n1 － 禁用',
    `creator_id`    INT UNSIGNED NOT NULL COMMENT '创建者标识',
    `create_time`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',

    PRIMARY KEY(`project_id`, `word_id`),
    INDEX `idx_project_id`(`project_id` ASC)
) ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='参数字典重写表';

CREATE TABLE `pat` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '访问令牌实体标识',
  `name` varchar(50) NOT NULL DEFAULT '' COMMENT '访问令牌名称',
  `description` varchar(500) NOT NULL DEFAULT '' COMMENT '访问令牌描述信息',
  `token` varchar(50) NOT NULL DEFAULT '' COMMENT '访问令牌',
  `expire` varchar(17) NOT NULL DEFAULT '' COMMENT '访问令牌过期时间',
  `privilege` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '访问令牌权限',
  `revoked` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '访问令牌撤态状态\n\n0 － 未撤销\n1 － 已撤销',
  `creator_id` int(10) unsigned NOT NULL COMMENT '创建者标识',
  `create_time` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_token` (`token` ASC)
) ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='访问令牌表，Personal Access Token';

CREATE TABLE `document` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '访问令牌实体标识',
  `project_id`    INT UNSIGNED NOT NULL COMMENT '归属项目',
  `progroup_id`   INT UNSIGNED NOT NULL COMMENT '归属项目分组',
  `name` varchar(50) NOT NULL DEFAULT '' COMMENT '文档标题',
  `name_pinyin` varchar(50) NOT NULL DEFAULT '' COMMENT '文档标题拼音',
  `content`  TEXT COMMENT '文档内容',
  `creator_id` int(10) unsigned NOT NULL COMMENT '创建者标识',
  `create_time` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',

  PRIMARY KEY (`id`),
  INDEX `idx_project_id` (`project_id` ASC)
) ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='文档表';

CREATE TABLE `audit` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '访问令牌实体标识',
  `interface_id`    INT UNSIGNED NOT NULL COMMENT '归属接口',
  `state`   TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '审核状态',
  `reason` varchar(500) NOT NULL DEFAULT '' COMMENT '拒绝审核原因',
  `create_time` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',

  PRIMARY KEY (`id`),
  INDEX `idx_audit_state` (`state` ASC)
) ENGINE=InnoDB AUTO_INCREMENT=10000 COMMENT='接口审核表';
