
var evaluate = require("./ast-evaluate");

module.exports = function(name){
	return function(data){
		// this.type = "ast";
		// this.name = name;
		this.data = data;
		this.evaluate = evaluate[name];
	};
};