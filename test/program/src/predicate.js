
// Functions to simplify & speed up the parser's matching process.
// that = predicate's this object

module.exports = function(lib,src,data){

	var result = {};

	result.expression = (function(){

		// operators in increasing order of precedence
		var precedence = ["||","&&","|","^","&",["==","!=","===","!=="],["<","<=",">",">="],["+","-"],["*","/","%"]];
		// convert above array into object
		for(var i=0, temp = {}; i<precedence.length || (precedence = temp) && false; ++i)
			if(Array.isArray(precedence[i]))
				for(var j=0; j<precedence[i].length; ++j)
					temp[precedence[i][j]] = i;
			else temp[precedence[i]] = i;

		var operation = function(left,operator,right){
			this.left = left;
			this.operator = operator;
			this.right = right;
		};
		operation.prototype.eval = function(callback){
			if(this.operator===undefined) this.left(callback);
			else src.datatype.$operator( this.operator, this.left.eval.bind(this.left),
				this.right.eval.bind(this.right), callback );
		};

		var bind = function(data,level){
			var left = new operation(data.value.shift()), p;
			while(data.operator.length){
				if( (p=precedence[data.operator[0]]) <= level ) break;
				left = new operation( left, data.operator.shift(), arguments.callee(data,p) );
			};
			return left;
		};

		return function(that,data){ that.result = bind(data,-1); return true; };
	})();

	result.literal = function(that){ // used to read string & regexp literals
		var c = that.data[that.index], d = c, e = {"t":"\t","n":"\n","r":"\r","v":"\v"};
		if(c===undefined) return false;
		for(that.result = ""; (c=that.data[++that.index]) && c!==d; ){
			if(c!=="\\") that.result += c;
			else {
				c = that.data[++that.index];
				if(c in e) that.result += e[c];
				else if(c==="u" || c==="x"){
					var len = (c==="x"?4:2), val = that.data.substr(that.index,len);
					if(val.length!==len || val.match(/[^0-9A-F]/i)) return false;
					that.result += String.fromCharCode( parseInt(val,16) );
				} else that.result += c;
			} // else
		} // for
		if(c!==d) return false; else ++that.index; // skip the delimiter
		return true;
	};

	result.whitespace = function(that,atleast){ // used to read whitespace
		var i, c, s = that.index, ws = /^[ \t\n\r\v]|\/\/|\/\*/;
		while( (c=that.data.substr(that.index,2)) && ws.test(c) ){
			if(c==="//" || c==="/*")
				if((i=that.data.indexOf(c==="/*"?"*/":"\n",that.index+2))!==-1) that.index = (i+(c==="/*"?2:1));
				else that.index = that.data.length; // EOF valid terminator for comments
			else ++that.index;
		}
		return (that.index-s) >= (atleast || 0);
	};

	return result;
};