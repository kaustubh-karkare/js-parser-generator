
// The language grammer rules are converted into multiple tree structure, whose nodes are defined here.

var pattern = {

	// Terminals

	"string" : function(data){
		this.data = data;
	},

	"regexp" : function(data){
		this.data = new RegExp(data,"g");
	},

	// Non-Terminals

	"production" : function(name){
		this.name = name;
	},

	"and" : function(name, series){
		this.name = name;
		this.series = series;
	},

	"or" : function(options){
		this.options = options;
	},

	"loop" : function(pattern, minimum, maximum){
		this.pattern = pattern;
		this.minimum = minimum;
		this.maximum = maximum;
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