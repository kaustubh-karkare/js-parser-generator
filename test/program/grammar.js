
{
	var lib = args[0], src = args[1], data = args[2];
	var order = ["predicate","datatype","operator","expression","memory"];
	for(var i=0,j; j=order[i]; ++i) src[j] = src[j](lib,src,data);

	var a = function(x){ return Array.isArray(x) ? x : (x?[x]:[]); };
	var boolean = function(x){ return new src.datatype.boolean(x).value; };
}

program = _ sl:statement* {
	return (function(obj){
		if(obj && typeof(obj)==="object"){
			for(var type in src.datatype)
				if(obj instanceof src.datatype[type])
					return type+": "+new src.datatype.string(obj).value;
			for(var key in obj)
				obj[key] = arguments.callee(obj[key]);
			return obj;
		}
		return obj;
	})(a(sl).map(function(s){ return s(); }));
};

_ = &{ return src.predicate.whitespace(this); };

statement
	= "{" _ sl:statement*  "}" _
		{ return a(sl).map(function(s){ return s(); }) }
	| d:declaration ";" _
		{ return d(); }
	| "if" _ "(" _ c:expression ")" _ t:statement ("else" _ e:statement)?
		{ return boolean(c()) ? t() : e && e(); }
	| "while" _ "(" _ c:expression ")" _ t:statement
		{ var l=[]; while(boolean(c())) l.push(t()); return l; }
	| "do" _ "(" _ c:expression ")" _ t:statement
		{ var l=[]; do l.push(); while (boolean(c())); return l; }
	| "for" _ "(" _ d:declaration ";" _ c:expression ";" _ i:expression ")" _ s:statement
		{ var l=[]; for(d();boolean(c());i()) l.push(s()); return l; }
	| exp:expression ";" _ { return exp(); }

declaration
	= type: &{ return src.predicate.declaration(this); } left:identifier "=" _ right:expression
		("," _ left:identifier "=" _ right:expression)*
		{
			left = a(left), right = a(right);
			for(var i=0; i<left.length; ++i)
				src.memory.new(left[i](),type,right[i]());
			return null;
		}

expression = e:exp_assign ("," _ e:exp_assign)*
	{ return a(e).map(function(e){ return e(); }).pop(); };

exp_assign = (left:identifier operator:op_assign _)* right:exp_ternary
	{
		left = a(left); operator = a(operator);
		for(var i=0, name, value = right(); i<left.length && (name=left[i]()); ++i)
			if(operator[i]==="=") src.memory.set(name, value);
			else src.memory.set(name, value=src.operator(operator[i].slice(0,-1),src.memory.get(name),value) );
		return value;
	};
exp_ternary = c:exp_binary (i:"?" _ t:expression ":" _ e:expression)?
	{ return !i ? c():( boolean(c()) ? t() : e() ); };
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
			case "+": return new src.datatype.integer(val());
			case "-": return new src.datatype.integer(val()).operator("-");
			default: return val()
		}
	}

exp_primary
	= boolean
	| number
	| string
	| name:identifier /* avoid conflicts with keywords, use a predicate here */
		{ return src.memory.get(name()); }

identifier = char:[$_A-Z]i char:[$_A-Z0-9]i * _ { return a(char).join(''); };

// Operators

op_assign = "=" | "+=" | "-=" | "*=" | "/=" | "%=" | "**=" ;

op_binary
	= "+" | "-" | "*" | "/" | "%" // arithmatic
	| "==" | "!=" | "===" | "!==" // equality
	| "<" | ">" | "<=" | ">=" // comparison
	| "&&" | "||" // logical
	;

op_unary = "!" / "+" / "-";

// Datatypes

boolean = str:("true"|"false") _ { return new src.datatype.boolean(str); }
string = &'"' data:&{ return src.predicate.literal(this); } _ { return new src.datatype.string(data); };
// regexp = &"/" data:&{ return src.predicate.literal(this); } flags:[igm]* _ { return 0 && src.datatype.regexp(data,flags); };
number = (digit:[0-9])+ _ { return new src.datatype.integer(a(digit).join('')); }
	| "NaN" _ { return src.datatype.integer.nan; }
	| "Infinity" _ { return src.datatype.integer.pinf; }