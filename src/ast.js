
var debug = require("./util").debug;

var ast = function(labels,data,env,code){
	if(debug) this.type = "astnode";
	this.data = data;
	this.eval = env("(function(){ var args = Array.prototype.slice.call(arguments);" +
		"return (function(" + labels.join(",") + ")" + code + ")(" +
		labels.map(function(x){ return "this.data."+x; }).join(",") + "); })").bind(this);
};

ast.prototype.execute = function(env){
	if(!this.root) throw new Error("Invalid Operation");
	return this.eval();
};

module.exports = ast;
