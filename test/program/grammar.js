
{

	var a = function(x){ return Array.isArray(x) ? x : (x?[x]:[]); };
	var lib = args[0], src = args[1];

	var order = ["predicate","datatype","operator","expression"];
	for(var i=0,j; j=order[i]; ++i) src[j] = src[j](lib,src);

}

start = _ sl:statement* {
	return (function(obj){
		if(obj && typeof(obj)==="object"){
			for(var type in src.datatype)
				if(obj instanceof src.datatype[type])
					return type+": "+obj.toString().value;
			for(var key in obj)
				obj[key] = arguments.callee(obj[key]);
			return obj;
		}
		return obj;
	})(a(sl).map(function(s){ return s(); }));
};

statement
	= "{" _ sl:statement*  "}" _
		{ return a(sl).map(function(s){ return s(); }) }
	| "if" _ "(" _ c:expression ")" _ t:statement ("else" _ e:statement)?
		{ return new src.datatype.boolean(c(),"boolean").value ? t() : e && e(); }
	| exp:expression ";" _ { return exp(); }

_ = whitespace* ;

whitespace
	= [ \t\n\r\v]
	| "//" &{ return src.predicate.ignoretill(this,"\n",false); } // single line comments
	| "/*" &{ return src.predicate.ignoretill(this,"*/",true); } // multi line comments

expression = exp_ternary;

exp_assign = (left:identifier operator:op_assign _)* right:exp_ternary;
exp_ternary = c:exp_binary (i:"?" _ t:expression ":" _ e:expression)?
	{ return !i ? c():( new src.datatype.boolean(c()).value ? t() : e() ); };

exp_binary
	= value:exp_unary (operator:op_binary _ value:exp_unary)*
		{
			var v = a(value).map(function(v){ return v(); });
			return src.expression({"value":v,"operator":a(operator)});
		}
exp_unary
	= "(" _ val:expression ")" _ { return val(); }
	| (op:op_unary _)? val:exp_primary {
		switch(op){
			case "!": return new src.datatype.boolean(val()).operator("!");
			case "-": return new src.datatype.integer(val()).operator("-")
			default: return val()
		}
	}

exp_primary
	= boolean
	| number
	| string
	| identifier // avoid conflicts with keywords, use a predicate here

identifier = char:[$_A-Z]i char:[$_A-Z0-9]i + { return a(char).join(''); };

// Operators

op_assign = "=" | "+=" | "-=" | "*=" | "/=" | "%=" | "|=" | "^=" | "&=" ;

op_binary
	= [+*-/%|^&] // arithmatic & bitwise
	| "==" | "!=" | "===" | "!==" // equality
	| "<" | ">" | "<=" | ">=" // comparison
	| "&&" | "||" // logical
	| "**" // special
	;

op_unary = "!" / "-";

// Datatypes

boolean = str:("true"|"false") _ { return new src.datatype.boolean(str); }
number = (sign:[+-] _)?? (digit:[0-9])+ _ { return new src.datatype.integer(a(sign).concat(a(digit)).join('')); };
string = &'"' data:&{ return src.predicate.literal(this); } _ { return new src.datatype.string(data); };
regexp = &"/" data:&{ return src.predicate.literal(this); } flags:[igm]* _ { return 0 && src.datatype.regexp(data,flags); };
