
{
	var a = function(x){ return Array.isArray(x) ? x : (x?[x]:[]); };
	var lib = args[0];

	// basic datatypes
	var primitive = (function(){
		var primitive = {};

		primitive.boolean = (function(){
			var b = function(init){
				if(init instanceof primitive.number) this.value = !init.value.eq(0);
				else this.value = (init==="true");
			};
			b.prototype.operator = function(operator,that){
				if(operator==="&&") return this.value && that.value ? b.true : b.false;
				else return this.value || that.value ? b.true : b.false;
			}
			b.prototype.toString = function(){ return this.value?"true":"false"; };
			return b;
		})();

		primitive.number = (function(){
			var bignum = lib.bignumber;
			var translate = {"+":"plus","-":"minus","*":"times","/":"div","%":"mod"};
			var n = function(init){
				if(init instanceof primitive.boolean) this.value = (init.value ? n.one : n.zero);
				else this.value = bignum(init);
			};
			n.zero = new n(0);
			n.one = new n(1);
			n.prototype.operator = function(operator,that){
				if(operator in translate) return new n(this.value[translate[operator]](that.value));
				else throw new Error("Not Implemented");
			};
			n.prototype.toString = function(){ return this.value.toString(); };
			return n;
		})();

		return primitive;
	})();

	// implicit type casting
	var operator = (function(){
		var ordering = [primitive.boolean,primitive.number];
		var typecast = function(data){
			var largest = -1;
			for(var i=0; i<data.length; ++i)
				largest = Math.max(largest,ordering.indexOf(data[i].constructor));
			for(var i=0; i<data.length; ++i)
				data[i] = new ordering[largest](data[i]);
			return data;
		};
		return function(op){
			var args = typecast(Array.prototype.slice.call(arguments,1));
			return args[0].operator.apply(args[0],[op].concat(args.slice(1)));
		};
	})();

	// implementation of binary operator precendence for expressions
	var expression = (function(){

		// operators in decreasing order of precedence
		var precedence = [["*","/","%"],["+","-"],["<","<=",">",">="],["==","!=","===","!=="],"&","^","|","&&","||"];
		// convert above array into object
		for(var i=0, temp = {}; i<precedence.length || (precedence = temp) && false; ++i)
			if(Array.isArray(precedence[i]))
				for(var j=0; j<precedence[i].length; ++j)
					temp[precedence[i][j]] = i;
			else temp[precedence[i]] = i;

		var operation = function(left,op,right){ this.left=left; this.op=op; this.right=right; };
		operation.prototype.eval = function(){
			if(this.op===undefined) return this.left;
			return operator(this.op,this.left.eval(),this.right.eval());
		};
		
		var bind = function(data,level){ // left associative
			var left = new operation(data.value.shift()), p;
			while(data.operator.length){
				if( (p=precedence[data.operator[0]]) >= level ) break;
				left = new operation( left, data.operator.shift(), arguments.callee(data,p) );
			};
			return left;
		};

		return function(data){ return bind(data,Infinity).eval(); }
	})();

	// Functions to simplify & speed up the parser's matching process.
	var predicate = {

		"ignoretill" : function(that,delim){
			for(var c; (c=that.data.substr(that.index,delim.length)) && c!==delim; that.index+=delim.length);
			if(c===delim){ ++that.index; return true; } else return false;
		},

		"literal" : function(that){ // used to read string & regexp literals
			// that = predicate's this object
			var c = that.data[that.index], d = c, e = {"t":"\t","n":"\n","r":"\r","v":"\v"};
			if(c===undefined) return false;
			for(that.result = ""; (c=that.data[++that.index]) && c!==d; ){
				if(c!=="\\") that.result += c;
				else {
					c = that.data[++that.index];
					if(c in e) that.result += e[c];
					else if(c==="u" || c==="x"){
						var len = (c==="x"?4:2), val = that.data.substr(that.index,l);
						if(val.length!==len || val.match(/[^0-9A-F]/i)) return false;
						that.result += String.fromCharCode( parseInt(val,16) );
					} else that.result += c;
				} // else
			} // for
			if(c!==d) return false; else ++that.index; // skip the delimiter
			return true;
		},

	};

	console.log("End of Constructor");
}

start = sl:statement* { return a(sl).map(function(s){ return s(); }) };

statement
	= "{" _ sl:statement*  "}" _
		{ return a(sl).map(function(s){ return s(); }) }
	| exp:expression ";" _ { return exp(); }

_ "whitespace"
	= [ \t\n\r\v]*
	| "//" &{ return predicate.ignoretill(this,"\n"); } // single line comments
	| "/*" &{ return predicate.ignoretill(this,"*/"); } // multi line comments

expression = exp_binary;

exp_assign = (left:identifier operator:assignop _)* right:exp_ternary;
exp_ternary = c:exp_binary (i:"?" _ t:expression ":" _ e:expression)? { return i?c:(c?t:e); };

exp_binary
	= value:exp_unary (operator:binaryop _ value:exp_unary)*
		{
			var v = a(value).map(function(v){ return v(); });
			return expression({"value":v,"operator":a(operator)});
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

boolean = str:("true"|"false") _ { return new primitive.boolean(str); }
number = (sign:[+-] _)?? (digit:[0-9])+ _ { return new primitive.number(a(sign).concat(a(digit)).join('')); };
string = &'"' data:&{ return predicate.literal(this); } _ { return data; };
regexp = &"/" data:&{ return predicate.literal(this); } flags:[igm]* _ { return data; };