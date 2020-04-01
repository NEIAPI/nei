/*
 * -------------------------------------------------------
 * ftl模版解析，从ftl中解析出变量类型
 * -------------------------------------------------------
 */
(function(){

    function Freemarker(){
        // var context = null;
        //初始list深度为0，用于解决list标签嵌套的情况
        var listDeep = [];
        var tagTypes={
            TAG_IF:'if',//if标签
            TAG_IF_SIZE:'ifsize',//if下?size标签
            TAG_IF_EMPTY:'ifempty',//if下??标签
            TAG_ELSE:'else',//else标签
            TAG_END_IF:'endif',//if结束标签
            TAG_LIST:'list',//list标签
            TAG_END_LIST:'endlist',//list结束标签
            TAG_REPLACE:'replace'//插值值语句
        };
        var symbols={
            'if': {start:'<#if', end:'>',type:tagTypes.TAG_IF},
            'replace':{start:'${', end:'}',type:tagTypes.TAG_REPLACE},
            'else': {start:'<#else', end:'>',type:tagTypes.TAG_ELSE},
            'endif': {start:'</#if', end:'>',type:tagTypes.TAG_END_IF},
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
                var expression={
                    expr:token.cmd,
                    type:token.type
                };
                if(listDeep.length>0){
                    listDeep[listDeep.length-1]['children'].push(expression);
                }else{
                    return expression;
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
                var expression={
                    expr:expr,
                    type:token.type,
                    tempVar:match[2],
                    children:[]
                }
                listDeep.push(expression)
            }

        }

        function parseEndList(token){
            if(token.type==tagTypes.TAG_END_LIST){
                 var expression=listDeep.pop();
                 if(listDeep.length>0){
                     listDeep[listDeep.length-1]['children']=[expression];
                 }else{
                     return expression;
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
                    var expression={
                        expr:expr,
                        type:tagTypes.TAG_IF_EMPTY
                    }
                    if(listDeep.length>0){
                        listDeep[listDeep.length-1]['children'].push(expression);
                    }else{
                        return expression;
                    }
                }
        }

        function parseIfSize(token){
                var cmd=token.cmd;
                if (cmd.indexOf('?size')>=0) {
                    //有size属性的，判断为array
                    var pos = cmd.indexOf('?size');
                    var expr = cmd.substring(0, pos);
                    var expression={
                        expr:expr,
                        type:tagTypes.TAG_IF_SIZE
                    }

                    if(listDeep.length>0){
                        listDeep[listDeep.length-1]['children'].push(expression);
                    }else{
                        return expression;
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
                if(expr){
                     expressions.push(expr);
                }
                //下一个标签起始位置
                pos = token.endPos+1;
            }
            return expressions;
        }



        // function setContext(type) {
        //     context = type;
        // }
        //
        // function inContext(type) {
        //   return context === type;
        // }
        //
        // function resetContext(){
        //     context=null;
        // }

        function error() {
          throw new Error('Unexpected token');
        }

        function test(template){
            var pos=0;
            while (pos>=0) {
                var token = nextToken(template, pos);
                pos = token.endPos+1;
            }
        }

        return {
            parse:parseExpression,
            test:test
        };
    };
    if (typeof NEJ !== 'undefined') {
      NEJ.define(Freemarker);
    } else if (typeof(module) !== 'undefined') {
      module.exports = Freemarker();
    } else {
      return Freemarker();
    }

})();
