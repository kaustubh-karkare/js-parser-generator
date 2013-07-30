
var debug = require("./util").debug;

var ast = function(args){
	if(debug) this.type = "astnode";
	this.str = args.str;
	this.data = args.data;
	var labels = Object.keys(args.data);
	this.eval = args.env(
		"(function(){" + (args.lazyeval?"":"var args = Array.prototype.slice.call(arguments);") +
		"return (function(" + labels.join(",") + ")" + args.code + ")(" +
		labels.map(function(x){ return "this.data."+x; }).join(",") + "); })"
	).bind(this);
};

module.exports = ast;
