/*
 * -------------------------------------------------------
 * ftl模版解析，从ftl中解析出变量类型
 * -------------------------------------------------------
 */
(function(){
    //主要查看下有没有.号的分隔符
    //数据类型
    // {
    //     typeName: obj.typeName,
    //     name: item.name,
    //     type: obj.type,
    //     isArray: item.isArray ? db.CMN_BOL_YES : db.CMN_BOL_NO,
    //     description: item.description
    // }
    // var dataTypes={
    //     STRING:1,
    //     BOOLEAN:2,
    //     NUMBER:3,
    //     ARRAY:4,
    //     OBJECT:5
    // };

    function Freemarker(){
        var context = null;
        //初始list深度为0，用于解决list标签嵌套的情况
        var listDeep = 0;
        var tagTypes={
            TAG_IF:'if',//if标签
            TAG_IF_SIZE:'?size',//if下?size标签
            TAG_IF_EMPTY:'??',//if下??标签
            TAG_ELSE:'else',//else标签
            TAG_END_IF:'endif',//if结束标签
            TAG_LIST:'list',//list标签
            TAG_END_LIST:'endlist',//list结束标签
            TAG_REPLACE:'replace'//插值值语句
        };
        var symbols={
            'if': {start:'<#if', end:'>',type:tagTypes.TAG_IF},
            'replace':{start:'${', end:'}',type:tagTypes.TAG_REPLACE},
            // 'else': {start:'<#else', end:'>',type:tagTypes.TAG_ELSE},
            // 'endif': {start:'</#if', end:'>',type:tagTypes.TAG_END_IF},
            'if_empty':{start:"??",type:tagTypes.TAG_IF_EMPTY},
            'if_size':{start:"?size",type:tagTypes.TAG_IF_SIZE},
            'list': {start:'<#list', end:'>',type:tagTypes.TAG_LIST},
            'endlist': {start:'</#list', end:'>',type:tagTypes.TAG_END_LIST}
        };

        //单次提取ftl中一个标签的内容，正常闭合的标签
        function nextToken(template, pos) {
                        var newPos,endPos,found={};
                        for (var i in symbols) {
                            //if下的if_size和if_empty会被忽略
                            var symbol = symbols[i];
                            var n = template.indexOf(symbol.start, pos);
                            if (n>=0 && (!found.symbol || n<found.newPos)) {
                                var e = template.indexOf(symbol.end, n);
                                //如果标签正常闭合，解析内容
                                if (e>=0) {
                                //记录标签的范围和标签内容
                                found.newPos = n;
                                found.endPos = e;
                                found.start = n + symbol.start.length;
                                found.symbol = i;
                                found.type = symbol.type;
                                //cmd为标签的内容
                                found.cmd = template.substring(found.start, found.endPos);
                            }
                        }
                    }
                    return found;
                }

        function parseReplace(token){
            if(token.type==tagTypes.TAG_REPLACE){
                var expr=token.cmd;
                return {
                    expr:expr,
                    type:tagTypes.TAG_REPLACE,
                    listDeep:listDeep
                }
            }
        }

        //解析list标签 <#list envelopes as envelope >
       function parseList(token){
            //设置当前解析的状态
            if(token.type==tagTypes.TAG_LIST){
                var match = token.cmd.match(/\s*(\S*)\s*as\s*(\S*)\s*/);
                if (match) {
                   var expr=match[1];
                }
                var deep=listDeep;
                listDeep++;
                return {
                    expr:expr,
                    type:tagTypes.TAG_LIST,
                    tempVar:match[2],
                    listDeep:deep
                }
            }

        }

        function parseEndList(token){
            if(token.type==tagTypes.TAG_END_LIST){
                var deep=listDeep;
                listDeep--;
                return {
                    expr:'',
                    type:tagTypes.TAG_END_LIST,
                    listDeep:deep
                }
            }
        }

        function parseIf(token){
            if(token.type==tagTypes.TAG_IF){
                //list嵌套情况
                 return parseIfEmpty(token)||parseIfSize(token);
            }
        }



        function parseIfEmpty(token){
                var cmd=token.cmd;
                if (cmd.indexOf('??')>=0) {
                    var expr = cmd.substring(0, cmd.length-2);
                    return {
                        expr:expr,
                        type:tagTypes.TAG_IF_EMPTY,
                        listDeep:listDeep
                    }
                }
        }

        function parseIfSize(token){
                var cmd=token.cmd;
                if (cmd.indexOf('?size')>=0) {
                    //有size属性的，判断为array
                    var pos = cmd.indexOf('?size');
                    var expr = cmd.substring(0, pos);
                    return {
                        expr:expr,
                        type:tagTypes.TAG_IF_SIZE,
                        listDeep:listDeep
                    }
                }
        }

        function parseExpression(template){
            var pos=0;
            var expressions=[]
            while (pos>=0) {
                var token = nextToken(template, pos);
                //一个支持的标签都解析不到
                if (!token.symbol) {
                    break;
                }
                var expr=parseIf(token)||parseReplace(token)||parseList(token)||parseEndList(token);
                expressions.push(expr);

                //下一个标签起始位置
                pos = token.endPos+1;
            }
            return expressions;
        }

        //从表达式中解析出数据结构
        function parseDataStructure(template){
            var expressions=parseExpression(template);
        }

        function setContext(type) {
            context = type;
        }

        function inContext(type) {
          return context === type;
        }

        function resetContext(){
            context=null;
        }

        function error() {
          throw new Error('Unexpected token');
        }

        function test(template){
            var pos=0;
            while (pos>=0) {
                var token = nextToken(template, pos);
                console.log(JSON.stringify(token));
                pos = token.endPos+1;
            }
        }

        return {
            parse:parseDataStructure,
            parseExpression:parseExpression,
            test:test
        }
    }

    if (typeof NEJ !== 'undefined') {
      NEJ.define(Freemarker);
    } else if (typeof(module) !== 'undefined') {
      module.exports = Freemarker();
    } else {
      return Freemarker();
    }

})()
