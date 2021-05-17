![NEI](https://neires.nos-eastchina1.126.net/logo.png)

专业的研发团队协作平台。

## 最新说明（15/05/21）
从上周六开始，NEI每天被DDOS攻击数十小时，一度导致服务不可用，我们已经向公司申请了很多资源来尝试防止，发现成本比想像中要大很多，NEI是一款免费的开源产品，我们决定不再向公司申请更多的资源来解决这种无耻的攻击。

为此，我们不会保证免费[在线版本](https://nei.netease.com)的稳定性，请大家尽快私有化部署NEI。大家的数据都完好无损，我们近期会尽快研发导出工具，帮大家将数据导出，敬请期待。

## 赞助
为了NEI开源版本能更长远的发展，考虑到团队的实际情况，我们决定打开赞助通道，所得赞助会作为NEI的日常运营费用，如容器费用、研发和维护人员的劳务报酬等。

<img src="https://neires.nos-eastchina1.126.net/nei_sponsor.png" width = "300" />

## 收费服务
此外，我们还提供以下收费服务，有需求的朋友可以加微信 `neidev` 详谈：

- 私有化部署服务
- 关于NEI的技术咨询服务
- 定制功能研发服务

## 概述

本代码仓库为 [NEI](https://nei.netease.com) 的源代码，大家可以下载进行私有部署。由于大家无法使用网易公司的网易通行证，所以**登录功能需要自行接入你们公司的帐号系统，代码需要自己开发**。为了功能演示方便，本仓库代码增加了站内帐号，同时去掉了网易通行证登录功能，此外，也去掉了所有和网易公司相关的基础设施，比如邮箱服务、IP 查询服务等等功能，大家视各自情况添加自己公司提供的服务即可。

- [部署方式](#部署方式)
- [注意事项](#注意事项)
- [本地开发](#本地开发)
- [文档教程](#文档教程)
- [使用要求](#使用要求)
- [更新记录](#更新记录)

## 部署方式
### 部署方式一：Docker 部署

因为有服务依赖，所以需要做容器编排，如果你使用的是 [docker-compose](https://docs.docker.com/compose/)，可以直接通过 `docker-compose up -d` 部署，默认服务运行在本地 `8082` 端口，你也可以加入 [Caddy](https://caddyserver.com/) 或者 [Nginx](https://www.nginx.com/) 编排用于实际生产环境。

### 部署方式二：普通部署

#### 安装服务器软件

- [Node.js](https://nodejs.org/en/) `>=6.9.2`。
> 如果安装完 Node.js 后，没有自动安装 [NPM](https://www.npmjs.com/get-npm)，则需要手动安装。
- [Redis](https://redis.io/) `>=2.8`。
- [MySQL](https://www.mysql.com/) `>=5.7.12`，初始化脚本为 [install.sql](./docs/install.sql)。
- [MongoDB](https://www.mongodb.com/) `>=3.4`。

#### 安装依赖和构建代码
在项目根目录依次执行下述命令，并确保没有错误发生：

- `npm install nej -g`
- `npm install`
- `npm run build`

上述过程一般都是自动化执行的，请结合你们公司的部署平台编写自动化脚本。

> 注意，`npm install` 的速度可能比较慢，可以使用淘宝源，比如 `npm install --registry=https://registry.npm.taobao.org`。

#### 启动应用
**部署前，请确认应用的配置是否都填写正确**，比如数据库的连接配置等。配置文件都放在 `server/config` 目录下面，其中 `develop.js`、`test.js`和`online.js` 分别为`本地环境`、`测试环境`、`线上环境`的配置文件。配置文件中的参数含义应该比较清晰直白，这里就不再展开介绍。然后，运行下述命令可启动应用：

```shell
 npm start
```

默认情况下，应用会运行在 `8082` 端口上，所以如果想将应用绑定到特定域名，一般需要 [Nginx](https://www.nginx.com/) 服务器，[参考配置](./docs/sample.nginx.conf)。

#### 停止应用
```shell
 npm stop
```

## 注意事项
- NEI 没有提供恢复已被删资源的功能，根据实际经验，会存在不小心删除接口、数据模型等情形，一旦发生损失就会很严重。建议给重要的数据库表（比如 `interface`、`datatype`、`parameter`等）添加删除操作的触发器，将删除的数据写入备份数据库，保证在误删除操作时可以找回数据。
- 为了安全，请给所有可以设置密码的软件添加密码，比如 Redis 等。
- 考虑到研发成本，NEI 只兼容 Chrome 浏览器。
- 由于打包工具的限制，NEI 的前端 JavaScript 不支持绝大多数的 ES6 语法，不然会构建失败。
- 部署时很有可能会遇到各种各样的环境问题，最好是让专业的运维人员来操作。
- 如果是可以复现的问题，很可能会被很多人遇到，所以优先推荐在 [issues](https://github.com/x-orpheus/nei/issues) 中进行搜索是否有相同问题。

## 本地开发
NEI 的前端使用的是 [NEJ](https://github.com/genify/nej) 和 [Regularjs](https://github.com/regularjs/regular)，后端使用的是 [Koa 框架](https://koajs.com/)。如果想对项目进行改造，需要学习上述技术。

首次运行需要先安装依赖：

```shell
npm install
```

运行下面的命令可以启动本地开发：

```shell
npm run dev
```

## 文档教程
- [视频教程](https://nei.netease.com/tutorial)
- [使用文档](https://github.com/x-orpheus/nei-toolkit/blob/master/doc/NEI基本概念介绍.md)

## 使用要求
- 本软件遵循 [MIT](./LICENSE) 协议。
- 私有部署需要填写[公司信息](./COMPANY.md)，公司名称加主站链接即可，请向本仓库提交 PR 或者将信息告知维护人员。

## 更新记录
[更新记录](./CHANGELOG)

## 感谢
感谢 [网易云](http://www.163yun.com/) 提供的云计算服务，目前 [NEI](https://nei.netease.com) 在线版本托管在网易云上。

## 使用交流组
NEI 用户交流 QQ 群(453281988)

![QQ 群](https://neires.nos-eastchina1.126.net/nei_qq.jpeg)
