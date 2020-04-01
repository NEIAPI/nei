Start
    = items:(Statement)+ {
        var result = {
            name: '',
            description: '',
            attributes: []
        }
        items.forEach(function(item){
            if (item === null) return;
            if (item.class) {
                result.name = item.class
                result.description = item.description
            } else if (item.name) {
                result.attributes.push(item)
            }
        })
        return result
    }

CommentOrLB = Comment / LB+ {
		return "" // ignore
}

Statement
    = _ ct:(Comment*) _ Annotations? _ f:(FieldModifiers)  __ dt:(DataType) __ name:(Character+) _ arr:TraditionalArray? dv:(DefaultValueAssign?) ";" _ cl:CommentOrLB  {
        if(f){
            return null;
        }
        return {
            name: name.join(''),
            typeName: dt.name,
            isArray: dt.isArray || (arr?true:false),
            defaultValue: dv == null?"":dv,
            description: ct.join('') || cl
        }
    }
    / ct:(Comment*) _ Annotations? _ "public" __ "class" __ clazz:(Word) AnyWithoutTerminator "{" LB* {
        return {
            description: ct.join(''),
            class: clazz
        }
    }
    / _ "}" _ LB* {
        return null
    }
    / a:(AnyWithoutLB) LB+ {
        return null
    }

TraditionalArray = "[" _ i:Interger? _  "]" {return true;}

DataType
    = "List" _ "<" w:(Word) _ ">" {
        return {
            name: w,
            isArray: true
        }
    }
    / w:(Word) arr:TraditionalArray {
    	return {
        	name: w,
            isArray: true
        }
    }
    / w:(Word) {
        return {
            name: w,
            isArray: false
        }
    }

// Annotations, now only support MarkerAnnotation, see https://docs.oracle.com/javase/specs/jls/se8/html/jls-9.html#jls-Annotation
Annotations
	= MarkerAnnotation

MarkerAnnotation
    = _ "@" AnyWithoutLB _ LB*


// Consistent with  https://docs.oracle.com/javase/specs/jls/se8/html/jls-8.html#jls-8.3.1.1
DataTypeModifier
    = "private"
    / "protected"
    / "public"

StaticFields
   = "static"

FinalFields
   = "final"

TransientFields
   = "transient"

VolatileFields
   = "volatile"

FieldModifiers
    = DataTypeModifier? s:(StaticFields?) f:(FinalFields?) TransientFields? VolatileFields?{
        /*
         如果把一个member定义为final意味着无法改变，此时该member不应导入
         而static则是类的，也不应该导入
         如： 有些时候JavaBean会implements一些interface(如Seriablizable)，就需要定义一个static final long 的serialVersionUID，显然这个member是不应该被导入的
         */
        return f === "final" || s === 'static';
    }



DefaultValueAssign
    = _ "=" _ d:DefaultValue _ {
       return d;

    }

ArrayEle = String/Number

Arrays =
		s:(ArrayEle) _ ss:("," _ (ArrayEle))+ {
        	var temp = ss.map(function(item){ return item[2];});
            temp.unshift(s);
        	return {
            	notArray: true,
            	value:temp
            };
        }

DefaultValue
	=
    Arrays //Pegjs 有bug。 没有回溯，所以数组类型必须在元素之前
    / ArrayEle
    / "[" _ v:DefaultValue vv:("," _ DefaultValue)* _ "]"{
    	// 支持一下几种:
        // [1,2,3]
        // [[1,2,3],[4,5,6]]
        // ["test", "it",["a", "test]];  parser中对这种差异性不处理,不进行类型检查。
    	if(v.notArray){
        	return v.value;
        }else{
        	var temp = new Array();
            temp.push(v);
        	if(vv.length == 0){
            	return temp;
            }else{
                var vvTemp = vv.map(function(item){return item[2]});
                return temp.concat(vvTemp);
            }
        }
    }
    / [^;]*{
        	return "";
    }


Comment
    = _ "//" _ c:(AnyWithoutLB) LB+ { // 因为都是包在一个java class 中, 所以一定有LB
        return c.join('')
    }
    / _ CommentStart c:(AnyWithoutCommentEnd) CommentEnd LB* {
        return c
    }

CommentStart
    = [/][*]+

CommentEnd
    = [*]+[/]

AnyWithoutCommentEnd
    = c:(!"*/" .)* {
        var comments = c.map(function(item){
            return item[1]
        }).join('').split('\n')
        var result = []
        comments.forEach(function(comment){
            var trimResult = comment.trim().replace(/^\*+|\*+$/g, '').trim()
            if (trimResult) {
                result.push(trimResult)
            }
        })
        return result.join(', ')
    }

String = '"' s:[^\"]+ '"'{
	return s.join('');
}

Number = f:Float{
			return f.map(function(i){ if(i instanceof Array) {return i.join('')} else return i}).join('');
		}
	   / Interger

DIGIT = [0-9]

Float_Exponent = e:[eE] s:[+-]? ds:DIGIT+ {
	return e + (s==null? "" : s) + ds.join('');
}

Float = [+-]? i:DIGIT* "." ds:DIGIT+ e:Float_Exponent?
	/ [+-]? d:DIGIT+ e:Float_Exponent

Interger = s:([+-])? d:(DIGIT+){
	return (s=='-' ? -1: 1) * Number(d.join(''));
}

Word
    = l:(Character+) {
        return l.join('');
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
