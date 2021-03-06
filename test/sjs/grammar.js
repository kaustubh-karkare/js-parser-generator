
{
	var lib = args[0], src = args[1], data = args[2];

	var order = ["predicate"];
	order.forEach(function(name){ src[name] = src[name](lib,src,data); });

	var init = function(callback){
		var order = ["memory","datatype","action"];
		lib.async.series(order.map(function(name){
			return function(cb){
				src[name](lib,src,data,function(e,result){
					if(!e) src[name] = result; cb(e);
				});
			};
		}), callback);
	};

	var a = function(x){ return Array.isArray(x) ? x : (x?[x]:[]); };

	var echo = function(cb,x){
		return function(){
			console.log("#echo",JSON.stringify(x?arguments[1]:arguments,null,4));
			typeof(cb)==="function" && cb.apply(null,arguments);
		};
	};
}

program
	= _ s:statements
		{
			init(function(e){
				if(e) return callback(e);
				// init was not chained in the following call as it modifies src
				lib.async.series([
					src.memory.function.start.bind(null,null,[],[],[]),
					function(cb){
						s(function(e,r){
							src.action.string(e||r,cb);
						});
					},
					src.memory.function.end.bind(null)
				], callback, function(r){ callback(null,r[1]); });
			});
		}

_ = &{ return src.predicate.whitespace(this); }
_1 = &{ return src.predicate.whitespace(this,1); }

statements = s:statement* { lib.async.series(a(s),callback); }
sblock = "{" _ s:statements "}" _ { s(callback); }

statement
	= sblock
	| ";" _ { callback(null,src.datatype.undefined.instance); }
	| "echo" _ exp:expression ";" _ { exp(echo(callback,true)); }
	| dec:declaration ";" _ { dec(callback); }
	| "if" _ "(" _ c:expression ")" _ t:statement ("else" _ e:statement)?
		{ src.action.condition(c,t,e,callback); }
	| "while" _ "(" _ condition:expression ")" _ then:statement
		{ src.action.loop(condition,null,then,callback); }
	| "do" _ then:statement "while" _ "(" condition:expression ")" _ ";" _
		{
			then(function(e,first){
				if(e) callback(e);
				else src.action.loop(condition,null,then,function(e,r){
					if(e) callback(e);
					else callback(null,[first].concat(r));
				});
			});
		}
	| "for" _ "(" _ declare:(declaration|expression) ";" _ condition:expression ";" _ next:expression ")" _ then:statement
		{
			declare(function(e){
				if(e) callback(e);
				else src.action.loop(condition,next,then,callback);
			});
		}
	| "for" _ "(" _ (d:"var" _)? i:identifier ( "," _ j:identifier ("," _ k:identifier)?)? "in" _ exp:expression ")" _ then:statement
		{ src.action.forin(d,i,j,k,exp,then,callback); }
	| "continue" _ ";" _ { callback("syntax.continue"); }
	| "break" _ ";" _ { callback("syntax.break"); }
	| "return" _ (exp:expression)? ";" _
		{
			if(exp) exp(function(error,result){ callback(error || "syntax.return", result) });
			else callback("syntax.return",src.datatype.undefined.instance);
		}
	| "throw" _ e:expression ";" _
		{ e(function(e,r){ callback(e||r); }); }
	| "try" _ t:sblock "catch" _ "(" _ i:identifier ")" _ c:sblock
		{ src.action.trycatch(t,i,c,callback); }
	| exp:expression ";" _ { exp(callback); }

declaration
	= "var" _1 left:identifier "=" _ right:exp_assign
		("," _ left:identifier "=" _ right:exp_assign)*
		{
			left = a(left); right = a(right);
			lib.async.series(left.concat(right),callback,function(result){
				lib.async.series(result.slice(0,left.length).map(function(name,i){
					return function(cb){ src.memory.set(name,result[i+left.length],cb); };
				}),callback,function(){ callback(null,src.datatype.undefined.instance); });
			});
		}

// Expression

expression = exp:exp_assign ("," _ exp:exp_assign)*
	{ lib.async.series(a(exp),callback,function(r){ callback(null,r.pop()); }); }

exp_assign
	= (left:exp_left operator:op_assign _)* right:exp_ternary
		{ src.action.assignment(a(left),a(operator),right,callback); };
op_assign = "=" | "+=" | "-=" | "*=" | "/=" | "%=" ;

exp_left
	= key:identifier ((key:op_suffix)* key:op_suffix_property)?
		{ lib.async.series(a(key),callback); }

exp_ternary
	= c:exp_binary (i:"?" _ t:expression ":" _ e:expression)?
		{ i ? src.action.condition(c,t,e,callback) : c(callback); }

exp_binary
	= value:exp_unary (operator:op_binary _ value:exp_unary)*
		tree: & { return src.predicate.expression(this,{"value":a(value),"operator":a(operator)}); }
		{ tree.eval(callback); }
op_binary
	= "+" | "-" | "*" | "/" | "%" // arithmatic
	| "==" | "!=" | "===" | "!==" // equality
	| "<" | ">" | "<=" | ">=" // comparison
	| "&&" | "||" // logical

exp_unary
	= operator:op_unary* ( val:exp_primary | "(" _ val:expression ")" _ )
		{
			lib.async.series(a(operator),callback,function(operator){
				src.action.unary(operator,val,callback);
			});
		}
op_unary
	= data:("typeof" | "void") _ { callback(null,data); }
	| data:("+" | "-" | "!") _ { callback(null,data); }

exp_primary
	= pre:op_prefix* name:( boolean | integer | string | array | object | function | identifier )
		&{ return src.predicate.keywords.indexOf(name)===-1; } post:op_suffix*
		{
			pre = a(pre); post = a(post);
			lib.async.series(pre.concat(name).concat(post), callback, function(result){
				src.action.primary( result.slice(0,pre.length), result[pre.length],
					result.slice(pre.length+1), callback );
			});
		}
op_prefix
	= key:"new" _ { callback(null,key); }
	| key:"delete" _ { callback(null,key); }
op_suffix
	= op_suffix_property
	| op_suffix_function

op_suffix_property
	= ( "." _ key:identifier | "[" _ key:expression "]" _ )
		{
			lib.async.waterfall([
				key,
				function(result,cb){
					if(typeof(result)==="string") new src.datatype.string(result,cb);
					else result.convert("string",cb);
				},
				function(result,cb){ result.id = "[]"; cb(null,result); }
			],callback);
		}
op_suffix_function
	= "(" _ (exp:exp_assign ("," _ exp:exp_assign)* )? ")" _
		{
			lib.async.series(a(exp),callback,function(args){
				args.id = "()";
				callback(null,args);
			});
		}

// Datatypes

identifier = str:&{ return src.predicate.identifier(this); } _
	{ callback(null,str); }

undefined = "undefined" _ { callback(null,src.datatype.undefined.instance); }

boolean = str:("true"|"false") _ { callback(null,src.datatype.boolean[str]); }

string
	= &"\"" data:&{ return src.predicate.literal(this); } _
		{ new src.datatype.string(data,callback); }

integer
	= (digit:[0-9])+ _ str:&{ this.result = a(digit).join(''); return true; }
		{ new src.datatype.integer(str,callback); }
	| "NaN" _
		{ callback(null,src.datatype.integer["NaN"]); }
	| "Infinity" _
		{ callback(null,src.datatype.integer["Infinity"]); }

array
	= "[" _ (item:exp_assign ("," _ item:exp_assign)*)? ("," _)? "]" _
		{
			lib.async.series(a(item),callback,function(list){
				new src.datatype.array(list,callback);
			});
		}

object_key
	= string
	| name:identifier
		{
			name(function(e,r){
				if(e) callback(e,r);
				else new src.datatype.string(r,callback);
			});
		}

object
	= "{" _ (key:object_key ":" _ val:exp_assign
		("," _ key:object_key ":" _ val:exp_assign)*)? ("," _)? "}" _
		{
			key = a(key); val = a(val);
			lib.async.series(key.concat(val),callback,function(result){
				new src.datatype.object({
					"key": result.slice(0,key.length),
					"val": result.slice(key.length)
				},callback);
			});
		}

function
	= "function" start:&{ this.result=this.index-8; return true; } _ "(" _
		(name:identifier ("," name:identifier)* )? ")" _ "{" _ body:statements "}"
		end:&{ this.result=this.index; return true; } _
		{
			lib.async.series.call(this,a(name),callback,function(args){
				if(["this","local","arguments"].filter(function(x){ return args.indexOf(x)!==-1; }).length)
					return callback("grammar.function.reserved-argument-name");
				new src.datatype.function({ "args":args, "body":body, "str":this.data.slice(start,end) },callback);
			});
		}

//*/