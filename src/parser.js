
var tokenize = require("./tokenizer"),
	build = require("./build"),
	State = require("./state");

var Parser = function(grammar){
	this.production = {};
	this.init = "";
	this.start = null;

	var tlist = tokenize(grammar);
	if(tlist.peek() && tlist.peek().type==="code")
		this.init = eval("(function(){" + tlist.next().data +
			"return function(code){ return eval(code); }; })");

	var p;
	while(tlist.peek()){
		p = build.production(tlist);
		this.production[ p.name ] = p;
		if(!this.start) this.start = p;
	}

	if(!this.start) throw new Error("Empty Grammar");
};

Parser.prototype.parse = function(data){
	var state = new State(this,data);
	// Set Up Execution Environment
	state.env = this.init();
	// Syntactically analyze the given data
	try { var ast = this.start.match(state); }
	catch(e) {
		// console.log("\nExpected:",state.expected);
		throw new Error("Syntax Error at index : "+state.index+"\n"+e.stack);
	}
	if(state.index<data.length)
		throw new Error("Could not parse beyond index : "+state.index);
	ast.root = true;
	return ast;
};

module.exports = Parser;