
var debug = require("./util").debug;

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

	"range" : function(data){
		if(debug) this.type = "range";
		this.start = [];
		this.end = [];
		this.individual = [];
		var flag = data.slice(data.lastIndexOf(":")+1);
		data = data.slice(0,-flag.length-1);
		this.ignoreCase = (flag.indexOf("i")!==-1);
		this.negative = (flag.indexOf("n")!==-1);
		for(var i=0,j,k,t; i<data.length; ++i){
			j = data.charCodeAt(i);
			if(i+1<data.length && data[i]==="\\" ){
				j = data.charCodeAt(i+=1);
				this.individual.push( j );
			} else if(i+2<data.length && data[i+1]==="-"){
				k = data.charCodeAt(i+=2);
				if(j>k){ t=j; j=k; k=t; }
				this.start.push(j);
				this.end.push(k);
			} else this.individual.push( j );
		}
		if(debug) this.regexp = "/["+(this.negative?"^":"")+data+"]/"+(this.ignoreCase?"i":"");
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

	// Interactive Nodes

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

var match = require("./match");
for(var key in pattern)
	pattern[key].prototype.match = match[key];

module.exports = pattern;