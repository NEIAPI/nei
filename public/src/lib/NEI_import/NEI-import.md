# NEI import module

## 如何使用

## 打包发布
要求webpack版本为3, 以及webpack-cli的大版本号同样为3。
直接在module下执行`webpack`, 然后引用`dist/NEISwagger.js`即可。 无发布

## 测试

测试框架是ts-mocha,所有的测试在SwaggerTestCase.ts。 会将`/test/testSource`下的yaml文件转换为nei支持的导入json，然后比较它和同目录下的json文件，如果相同即通过测试。 建议使用webstorm或idea, 因为:

1. 在测试源码中左边会直接出现可以运行标志，点击即可
2. 后面的结果断言如果不同的话，提供一个`click to see difference`的链接，点开可以用图形化比较。方便开发。

所以开发逻辑是，先更改期望的json文件(部分), 然后更改源码(不用重新打包)，再运行测试。
