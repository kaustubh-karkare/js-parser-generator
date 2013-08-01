
var tokenize = require("./tokenizer"),
	build = require("./build"),
	pattern = require("./pattern"),
	State = require("./state");

var Parser = function(grammar,config){

	this.config = {
		debug: false,
		partial: false, // does the complete input string need to be consumed?
		unwrap: true, // where possible, should array wrappers be removed?
		lazyeval: false // should functions to evaluate be returned instead of results of evalution?
	};
	if(!config || typeof(config)!=="object") config = {};
	for(var key in config) if(key in this.config) this.config[key] = !!config[key];

	var tp = this.production = {};
	var tlist = tokenize(grammar);

	// create the function to initialize the environment
	var code = "";
	if(tlist.peek() && tlist.peek().type==="code")
		code = tlist.next().data;
	this.init = eval("(function(args){ " + code + "return function(code){ return eval(code); }; })");

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
		var action = "{ return $"+(this.config.lazyeval?"()":"")+"; }";
		var temp = new pattern.and([ new pattern.label("$",this.start), new pattern.predicate(true,check) ]);
		this.start = new pattern.production("$", null, new pattern.action(temp,action), ["$"]);
	}
};

Parser.prototype.parse = function(data,args){
	var state = new State(this,data);
	state.env = this.init.call( {"config":this.config }, Array.isArray(args)?args:[] ); // Set Up Execution Environment
	var ast = this.start.match(state); // Syntactically analyze the given data
	ast && (ast.eval.ast = ast);
	return this.config.lazyeval ? ast && ast.eval : ast && ast.eval();
};

module.exports = Parser;