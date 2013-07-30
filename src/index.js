
var Parser = require("./parser");

module.exports = {
	buildParser : function(g,c){ return new Parser(g,c); }
};