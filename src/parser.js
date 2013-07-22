
var tokenize = require("./tokenizer"),
	build = require("./build"),
	State = require("./state");

var Parser = function(grammer){
	this.production = {};
	this.init = "";
	this.start = null;

	var tlist = tokenize(grammer);
	if(tlist.peek() && tlist.peek().type==="code")
		this.init = tlist.next().data;

	var p;
	while(tlist.peek()){
		p = build.production(tlist);
		this.production[ p.name ] = p;
		if(!this.start) this.start = p;
	}

	if(!this.start) throw new Error("Empty Grammer");
};

Parser.prototype.parse = function(data){
	var state = new State(this,data);
	try {
		var ast = this.start.match(state);
	} catch(e) {
		throw new Error("Syntax Error at index : "+state.index);
	}
	if(state.index<data.length)
		throw new Error("Could not parse beyond index : "+state.index);
	ast.init = this.init;
	return ast;
};

module.exports = Parser;