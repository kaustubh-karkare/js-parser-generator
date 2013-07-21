
var debug = 0;

var pattern = {


	// Root Node

	"production" : function(name, pattern){
		if(debug) this.type = "production";
		this.name = name;
		this.pattern = pattern;
	},

	// Leaf Nodes

	"empty" : function(){},

	"string" : function(data){
		if(debug) this.type = "string";
		this.data = data;
	},

	"regexp" : function(data){
		if(debug) this.type = "regexp";
		this.data = new RegExp(data,"g");
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

	"loop" : function(pattern, minimum, maximum, greedy){
		if(debug) this.type = "loop";
		this.pattern = pattern;
		this.minimum = minimum;
		this.maximum = maximum;
		this.greedy = greedy;
	},

	"lookahead" : function(positive,pattern){
		if(debug) this.type = "lookahead";
		this.positive = positive;
		this.pattern = pattern;
	},

	// Interactive Node

	"label" : function(name,pattern){
		if(debug) this.type = "label";
		this.name = name;
		this.pattern = pattern;
	},

	"action" : function(pattern,code,labels){
		if(debug) this.type = "action";
		this.pattern = pattern;
		this.code = code;
		this.labels = labels;
	},

	"predicate" : function(pattern,code){
		if(debug) this.type = "predicate";
		this.pattern = pattern;
		this.code = code;
	}

};

var ni = function(){ throw new Error("Not Implemented."); };

var augment = function(file,name){
	var data = require(file);
	for(var key in pattern)
		pattern[key].prototype[name] = data[key] || ni;
};

augment("./pattern-match","match");

module.exports = pattern;