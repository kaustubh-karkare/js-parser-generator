
var Parser = require("./parser");

module.exports = {
	buildParser : function(grammar){ return new Parser(grammar); }
}