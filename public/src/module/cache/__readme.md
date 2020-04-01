# 缓存的使用方法

一般来说, 项目中的资源实体都有对应的缓存, 它们统一继承自项目级缓存(文件cache.js), 而项目级缓存又继承自 _$$CacheListAbstract, _$$CacheListAbstract 的使用文档可以看这里: [_$$CacheListAbstract](http://nej.netease.com/help/abstract._$$CacheListAbstract.html).

所以, 一般情况下, 所有的资源实体都会有增删查改方法:

* 增: _$addItem, 完成事件: onitemadd
* 删: _$deleteItem, 完成事件: onitemdelete
* 查: _$getItem, 完成事件: onitemload
* 改: _$updateItem, 完成事件: onitemupdate

其他方法可以查阅相应缓存的具体实现