
// implementation of binary operator precendence for expressions
module.exports = function(lib,src){

	// operators in decreasing order of precedence
	var precedence = [["**"],["*","/","%"],["+","-"],["<","<=",">",">="],["==","!=","===","!=="],"&","^","|","&&","||"];
	// convert above array into object
	for(var i=0, temp = {}; i<precedence.length || (precedence = temp) && false; ++i)
		if(Array.isArray(precedence[i]))
			for(var j=0; j<precedence[i].length; ++j)
				temp[precedence[i][j]] = i;
		else temp[precedence[i]] = i;

	var operation = function(left,op,right){ this.left=left; this.op=op; this.right=right; };
	operation.prototype.eval = function(){
		if(this.op===undefined) return this.left;
		return src.operator(this.op,this.left.eval(),this.right.eval());
	};
	
	var bind = function(data,level){ // left associative
		var left = new operation(data.value.shift()), p;
		while(data.operator.length){
			if( (p=precedence[data.operator[0]]) >= level ) break;
			left = new operation( left, data.operator.shift(), arguments.callee(data,p) );
		};
		return left;
	};

	return function(data){ return bind(data,Infinity).eval(); };
};