
var tokenize = require("./tokenizer"),
	build = require("./builder"),
	pattern = require("./pattern"),
	ast = require("./ast"),
	State = require("./state");

var Parser = function(grammer){
	this.production = {};
	this.ast = {};
	var start = null;

	var tlist = tokenize(grammer), rule;
	while(tlist.peek()){
		rule = build(tlist);
		if(rule.name){
			if(start===null) start = rule.name;
			this.production[rule.name] = rule;
			this.ast[rule.name] = ast(rule.name);
			rule.name = null; // explain
		}
	}

	if(start) this.production["~"] = new pattern.production(start);
	else throw new Error("Empty Grammer");
};

Parser.prototype.process = function(code){
	var state = new State(this,code);
	return this.production["~"].match(state);
};



module.exports = Parser;