{
  function getComment(comment) {
    if (comment[0]) {
      // 从注释中过滤掉参数的描述信息
      var commentParts = comment[0].split('\n');
      return commentParts.filter(function (comment) {
        return !comment.startsWith('@');
      }).join(', ');
    }
    return '';
  }

  function setParamsDescriptionFromComment(params, comment) {
    if (comment[0]) {
      // 从注释中提取参数的描述信息
      // 只处理 “@param key   配置项名称” 这种形式
      var comments = comment[0].split('\n');
      comments.forEach(function (comment) {
        var commentParts = comment.split(/[ \t]+/);
        if (commentParts[0].startsWith('@param')) {
          var foundParam = params.find(function (param) {
            return param.name === commentParts[1];
          });
          if (foundParam) {
            // 去掉第一项 @param，和第二项参数名，剩余的字符重新 join
            commentParts.shift();
            commentParts.shift();
            foundParam.description = commentParts.join(' ');
          }
        }
      });
    }
  }
}
Start
    = fileComment:(Comment)*
      pkg:(Package)
      imports:(Imports)*
      description:(Comment)*
      interfaceName:InterfaceName
      methods:(Method)*
      Any {
    	return {
            package: pkg,
            interfaceName: interfaceName,
            imports: imports,
            description: getComment(description),
            methods: methods
        }
      }

Package
    = "package" _ w:(AnyWithoutTerminator) ";" LB* {
    	return w.join('');
    }

Imports
    = "import"  _ w:(AnyWithoutTerminator) ";" LB* {
    	return w.join('');
    }

InterfaceName
    = "public interface" __ w:(Word) __ "{" LB*  {
    	return w;
    }

Method
    = methodComment:(Comment)* _ response:(Response) _ method:(Word) _ "(" params:(Parameter)* ");"  LB* {
        setParamsDescriptionFromComment(params, methodComment);
        return {
        	description: getComment(methodComment),
            output: response,
            method: method,
            inputs: params
        }
    }

Response
    // RpcResult<Map<String, String>>
    = importType:(Word) "<Map<" mapType:(WordOrCommaOrSpace) ">>" {
    	return {
        	type: 'Object',
            importType: importType
        };
    }
    // Map<String,Object>
    / "Map<" mapType:(WordOrCommaOrSpace) ">" {
    	return {
        	type: 'Object'
        };
    }
    // RpcResult<List<SoundDetailDTO>>
    / importType:(Word) "<List<" type:(Word) ">>" {
    	return {
        	isArray: true,
            type: type,
            importType: importType
        };
    }
    // RpcResult<PageDTO<List<SoundDetailDTO>>>
    // 这种情况表示，导入的是 RpcResult 类型，它的可变部分是 PageDTO
    // 再详细的部分由 PageDTO 自己定义，不需要再处理了
    / importType:(Word) "<" type:(Word) "<List<" listType:(Word) ">>>" {
    	return {
            importTypeVar: type,
            importType: importType
        };
    }
    // List<SoundDeviceManagerDTO>
    / "List<" type:(Word) ">" {
    	return {
        	isArray: true,
            type: type
        };
    }
    // List<Object>
    / importType:(Word) "<" type:(Word) ">" {
    	return {
        	type: type,
            importType: importType
        };
    }
    // int, RpcResult...
    / type:(Word) {
    	return {
        	type: type
        };
    }

Parameter
    = paramType:(ParameterType) _ paramName:(Word) ","? _ {
    	return Object.assign(paramType, {
            name: paramName
        });
    }

ParameterType
	= "List<" type:(Word) ">" {
    	return {
        	type: type,
            isArray: true
        };
    }
	/ "<Map<" mapType:(WordOrCommaOrSpace) ">>" {
    	return {
        	type: 'Object'
        };
    }
    / type:(Word) {
    	return {
        	type: type
        }
    }

Comment
    = _ "//" _ c:(AnyWithoutLB) LB+ {
        return c.join('');
    }
    / _ CommentStart c:(AnyWithoutCommentEnd) CommentEnd LB* {
        return c;
    }
    / LB

CommentStart
    = [/][*]+

CommentEnd
    = [*]+[/]

AnyWithoutCommentEnd
    = c:(!"*/" .)* {
        var comments = c.map(function(item){
            return item[1]
        }).join('').split('\n');
        var result = [];
        comments.forEach(function(comment){
            var trimResult = comment.trim().replace(/^\*+|\*+$/g, '').trim();
            if (trimResult) {
                result.push(trimResult);
            }
        });
        return result.join('\n');
    }

Word
    = l:(Character+) {
        return l.join('');
    }

WordOrCommaOrSpace
	= c:[a-zA-Z0-9, ]+ {
    	return c.join('');
    }

Character
    = [a-zA-Z0-9]

WS "Whitespace"
    = [ \t]

_ "Zero or more whitespaces"
    = WS*

__ "One or more whitespaces"
    = WS+

LB
    = [\r\n]

AnyWithoutTerminator
    = [^;{]*

AnyWithoutLB
    = [^\r\n]*
Any
    = .*