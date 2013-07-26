
var debug = require("./util").debug;

var generate = function(labels,code){
	var result = "return (function(" + labels.join(",") + ")" + code +
		").apply(this.env,[" + labels.map(function(x){ return "this.data."+x; }).join(",") + "]);";
	return eval("(function(){"+result+"})");
};

var ast = function(labels,data,code){
	if(debug) this.type = "astnode";
	this.data = data;
	// this.code = code;
	this.eval = generate(labels, code);
};

ast.prototype.setenv = function(env){
	this.env = env;
	for(var key in this.data){
		if(Array.isArray(this.data[key])){
			for(var i=0; i<this.data[key].length; ++i)
				if(this.data[key][i] instanceof ast)
					this.data[key][i].setenv(env);
		} else {
			if(this.data[key] instanceof ast)
				this.data[key].setenv(env);
		}
	}
	return this;
};

ast.prototype.execute = function(env){
	// this.init is set by the Parser for the root astnode only
	if(this.init===undefined) throw new Error("Invalid Operation");
	// Create Execution Environment (accessible from all nodes)
	this.setenv(env = env || {});
	// Execution Environment Constructor
	eval("(function(){"+this.init+"})").apply(env);
	// Start Actual Execution
	this.result = this.eval();
	// Execution Environment Destructor
	if(typeof(env.destructor)==="function")
		env.destructor.apply(env);
	return this.result;
};

module.exports = ast;
