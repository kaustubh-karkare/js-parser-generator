
var tokenize = require("./tokenizer"),
	build = require("./build"),
	pattern = require("./pattern"),
	State = require("./state"),
	util = require("./util");

var Parser = function(grammar,config){

	this.config = {
		debug: false,
		partial: false, // does the complete input string need to be consumed?
		unwrap: true, // where possible, should array wrappers be removed?
		lazyeval: false, // should the evaluation functions be returned instead of results?
		async: false, // should the last argument to every action function be a callback?
	};
	if(!config || typeof(config)!=="object") config = {};
	for(var key in config) if(key in this.config) this.config[key] = !!config[key];
	if(!this.config.lazyeval) this.config.async = false; // async requires lazyeval enabled

	var tp = this.production = {};
	var tlist = tokenize(grammar);

	// create the function to initialize the environment
	var code = "";
	if(tlist.peek() && tlist.peek().type==="code")
		code = tlist.next().data;
	this.init = eval("(function(args){" + code + "return function(code){ return eval(code); }; })");
	// assumption: the initialization code does not contain a premature return statement

	// parse the (remaining) grammer file, add each item to this.production
	var p, first;
	while(tlist.peek()){
		p = build.production(tlist);
		this.production[ p.name ] = p;
		if(!first) first = p.name;
	}

	// ensure that there is at least one production
	if(!first) throw new Error("Empty Grammar");

	// ensure that only valid production names are in the this.start array
	this.start = ( Array.isArray(config.start) ? config.start : [config.start] )
		.filter(function(x){ return typeof(x)==="string" && x in tp; });
	if(this.start.length===0) this.start.push(first);

	// wrap the starting productions with a pattern.or, if necessary
	if(this.start.length===1) this.start = tp[this.start];
	else this.start = new pattern.or(this.start.map(function(x){ return tp[x]; }));

	if(!this.config.partial){
		// add a predicate (and additional necessary patterns) to check for completion
		var check = "{ this.error = 'Incomplete'; return this.index===this.data.length; }";
		var action = "{ return $"+(this.config.lazyeval?this.config.async?"(callback)":"()":"")+"; }";
		var temp = new pattern.and([ new pattern.label("$",this.start), new pattern.predicate(true,check) ]);
		this.start = new pattern.production("$", null, new pattern.action(temp,action), ["$"]);
	}
};

Parser.prototype.parse = function(data,args){
	var state = new State(this,data);

	// Set Up Execution Environment.
	var context = { "config": util.clone(this.config), "data": data };
	state.env = this.init.call( state.context = context, Array.isArray(args)?args:[] );
	// A basic test to prevent return statements in the initialization block. Not fool-proof.
	if(typeof(state.env)!=="function" || state.env("(function(x){ return x; })")(context)!==context)
		throw new Error("Premature Termination of Initialization Block");

	// Syntactically analyze the given data, and return the result.
	var root = this.start.match(state);
	if(!root) throw new Error("Expected at index "+state.errorpos+": ["+state.expected.join(", ")+"]");
	return this.config.lazyeval ? root : root();
};

module.exports = Parser;