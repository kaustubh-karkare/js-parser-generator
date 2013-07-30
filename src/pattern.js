
var debug = 0;

var pattern = {

	// Root Node

	"production" : function(name, altname, pattern, labels){
		if(debug) this.type = "production";
		this.name = name;
		this.altname = altname;
		this.pattern = pattern;
		this.labels = labels;
	},

	// Leaf Nodes

	"empty" : function(){},

	"string" : function(data){
		if(debug) this.type = "string";
		this.data = data[0];
		this.ignoreCase = data[1];
	},

	"range" : function(data){
		if(debug) this.type = "range";
		this.data = data[0];
		this.ignoreCase = (data[1].indexOf("i")!==-1);
		this.negative = (data[1].indexOf("n")!==-1);
		this.display = "["+(this.negative?"^":"")+this.data+"]"+(this.ignoreCase?"i":"");
	},

	"reference": function(name){
		if(debug) this.type = "reference";
		this.name = name;
	},

	// Flow Control Operations

	"and" : function(series){
		if(debug) this.type = "and";
		this.series = series;
	},

	"or" : function(options){
		if(debug) this.type = "or";
		this.options = options;
	},

	"loop" : function(pattern, maximum, greedy){
		if(debug) this.type = "loop";
		this.pattern = pattern;
		this.maximum = maximum;
		this.greedy = greedy;
	},

	"lookahead" : function(positive,pattern){
		if(debug) this.type = "lookahead";
		this.positive = positive;
		this.pattern = pattern;
	},

	// Interactive Nodes

	"label" : function(name,pattern){
		if(debug) this.type = "label";
		this.name = name;
		this.pattern = pattern;
	},

	"action" : function(pattern,code){
		if(debug) this.type = "action";
		this.pattern = pattern;
		this.code = code;
	},

	"predicate" : function(positive,code){
		if(debug) this.type = "predicate";
		this.positive = positive;
		this.code = code;
	}

};

var match = require("./match");
for(var key in pattern)
	pattern[key].prototype.match = match[key];

module.exports = pattern;