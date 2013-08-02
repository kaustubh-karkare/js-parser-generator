
{

	var a = function(x){ return Array.isArray(x) ? x : (x?[x]:[]); };
	var lib = args[0], src = args[1];

	var order = ["predicate","primitive","operator","expression"];
	for(var i=0,j; j=order[i]; ++i) src[j] = src[j](lib,src);

}


///////////////////////// START OF GRAMMAR /////////////////////////

start = _ sl:statement* { return a(sl).map(function(s){ return s(); }) };

statement
	= "{" _ sl:statement*  "}" _
		{ return a(sl).map(function(s){ return s(); }) }
	| "if" _ "(" _ c:expression ")" _ t:statement ("else" _ e:statement)?
		{ return new src.primitive.boolean(c(),"boolean").value ? t() : e && e(); }
	| exp:expression ";" _ { return exp(); }

_ = whitespace* ;

whitespace
	= [ \t\n\r\v]
	| "//" &{ return src.predicate.ignoretill(this,"\n",false); } // single line comments
	| "/*" &{ return src.predicate.ignoretill(this,"*/",true); } // multi line comments

expression = exp_binary;

exp_assign = (left:identifier operator:assignop _)* right:exp_ternary;
exp_ternary = c:exp_binary (i:"?" _ t:expression ":" _ e:expression)? { return i?c:(c?t:e); };

exp_binary
	= value:exp_unary (operator:binaryop _ value:exp_unary)*
		{
			var v = a(value).map(function(v){ return v(); });
			return src.expression({"value":v,"operator":a(operator)});
		}
exp_unary
	= "(" _ val:expression ")" _ { return val(); }
	| boolean
	| number
	| identifier // avoid conflicts with keywords, use a predicate here
	;

identifier = char:[$_A-Z]i char:[$_A-Z0-9]i + { return a(char).join(''); };

// Operators

assignop = "=" | "+=" | "-=" | "*=" | "/=" | "%=" | "|=" | "^=" | "&=" ;

binaryop
	= [+*-/%|^&] // arithmatic & bitwise
	| "==" | "!=" | "===" | "!==" // equality
	| "<" | ">" | "<=" | ">=" // comparison
	| "&&" | "||" // logical
	;

// Primitive Datatypes

boolean = str:("true"|"false") _ { return new src.primitive.boolean(str); }
number = (sign:[+-] _)?? (digit:[0-9])+ _ { return new src.primitive.number(a(sign).concat(a(digit)).join('')); };
string = &'"' data:&{ return src.predicate.literal(this); } _ { return data; };
regexp = &"/" data:&{ return src.predicate.literal(this); } flags:[igm]* _ { return data; };
