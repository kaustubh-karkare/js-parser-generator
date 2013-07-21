
var generate = function(labels,code){
	var result = "(function(){\nvar env = this.env";
	for(var i=0; i<labels.length; ++i)
		result+=", "+labels[i]+" = this.data."+labels[i];
	result += ";\n" + code + "\n})";
	return eval(result);
};

var ast = function(labels,data,code){
	// this.type = "astnode";
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
	// Initialize Execution Environment
	eval(this.init);
	// Start Actual Execution
	return this.eval();
};

module.exports = ast;
