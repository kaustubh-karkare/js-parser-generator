
{
	var lib = args[0], src = args[1], data = args[2];

	var order = ["predicate"];
	order.forEach(function(name){ src[name] = src[name](lib,src,data); });

	var init = function(callback){
		var order = ["action","datatype","memory"];
		lib.async.series(order.map(function(name){
			return function(cb){
				src[name](lib,src,data,function(e,result){
					if(!e) src[name] = result; cb(e);
				});
			};
		}), callback);
	};

	var a = function(x){ return Array.isArray(x) ? x : (x?[x]:[]); };
	var keywords = [
		"if","while","do","for","function","new","delete","typeof","void",
		"undefined","boolean","true","false","integer","NaN","Infinity","string"];

	var echo = function(cb){ return function(){ console.log("#",arguments); cb.apply(null,arguments); }; };
}

program
	= _ s:statements
		{
			init(function(e){
				if(e) return callback(e);
				// init was not chained in the following call as it modifies src
				lib.async.waterfall([s,src.action.string], callback);
			});
		}

_ = &{ return src.predicate.whitespace(this); }
_1 = &{ return src.predicate.whitespace(this,1); }

statements
	= s:statement*
		{ lib.async.series(a(s),callback); }

statement
	= "{" _ s:statements  "}" _ { s(callback); }
	| dec:declaration ";" _ { dec(callback); }
	| exp:expression ";" _ { exp(callback); }
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
	| "for" _ "(" _ declare:declaration ";" _ condition:expression ";" _ next:expression ")" _ then:statement
		{
			declare(function(e){
				if(e) callback(e);
				else src.action.loop(condition,next,then,callback);
			});
		}

declaration
	= type:&{ return src.predicate.declaration(this); } left:identifier "=" _ right:exp_assign
		("," _ left:identifier "=" _ right:exp_assign)*
		{
			left = a(left); right = a(right);
			lib.async.series(left.concat(right),callback,function(result){
				lib.async.series(result.slice(0,left.length).map(function(name,i){
					return function(cb){ src.memory.new(name,type,result[i+left.length],cb); };
				}),callback);
			});
		}

expression = exp:exp_assign ("," _ exp:exp_assign)*
	{ lib.async.series(a(exp),callback,function(r){ callback(null,r.pop()); }); }

exp_assign
	= (left:identifier operator:op_assign _)* right:exp_ternary
		{
			left = a(left); operator = a(operator);
			lib.async.series(left.concat(right),callback,function(names){
				var value = names.pop();
				lib.async.series(names.reverse().map(function(name,i){
					if(operator[i]==="=") return function(cb){ src.memory.set(name,value,cb); };
					else return function(cb){
						lib.async.waterfall([
							function(cb2){ src.memory.get(name,cb2); },
							function(current,cb2){ src.datatype.$operator(operator[i].slice(0,-1),current,value,cb2); },
							function(next,cb2){ src.memory.set(name,value=next,cb2); }
						],cb);
					};
				}),callback,function(){ callback(null,value); });
			});
		};
op_assign = "=" | "+=" | "-=" | "*=" | "/=" | "%=" ;

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
	= "(" _ val:expression ")" _
		{ val(callback); }
	| pre:op_prefix* val:exp_primary post:op_suffix*
		{ src.action.unary(a(pre),val,a(post),callback); }
op_prefix
	= data:("delete" | "new" | "typeof" | "void") _1 { callback(null,data); }
	| data:("++" | "--" | "+" | "-" | "!") _ { callback(null,data); }
op_suffix
	= "++" _ | "--" _
	| "." _ identifier
	| "[" _ expression "]" _
	| "(" _ (exp_assign ("," _ exp_assign)* )?
// pre/post increment operators require variables, not values
// prefix operators have higher precendence
// the new operator requires the current value to be a function & suffix operator to be a call

exp_primary
	= boolean
	| integer
	| string
	| name:identifier /* avoid conflicts with keywords, use a predicate here */
		{ lib.async.waterfall([name,src.memory.get],callback); }
	| function

identifier = char:[$_A-Z]i char:[$_A-Z0-9]i * _ str:&{
		var str = a(char).join('');
		if(keywords.indexOf(str)!==-1) return false;
		this.result = str;
		return true;
	} { callback(null,str); };

// Datatypes

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

function
	= "function" _ "(" _ (name:identifier ("," name:identifier)* )? ")" _ "{" _ body:statements "}" _
		{ callback("grammar.function"); if(0) new src.datatype.function({ "args":a(name), "body":body }); }