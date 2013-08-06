
var debug = require("./util").debug;

var ast = function(args){
	if(debug) this.type = "astnode";
	this.str = args.str;
	this.data = args.data;
	var labels = Object.keys(args.data);
	this.context = args.context;
	this.eval = args.env(
		"(function(){" + (args.lazyeval?"":"var args = Array.prototype.slice.call(arguments);") +
		(args.async ? " var callback = args.pop(); if(typeof(callback)!==\"function\") " +
			"throw new Error(\"Callback Not Provided!\"); " : "") +
		"return (function(" + labels.join(",") + ")" + args.code + ").apply(this.context,[" +
		labels.map(function(x){ return "this.data."+x; }).join(",") + "]); })"
	).bind(this);
};

module.exports = ast;
