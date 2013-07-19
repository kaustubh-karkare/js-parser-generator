
var fs = require("fs"),
	filedata = function(path){ return fs.readFileSync(path).toString(); };

var Parser = require("./src/parser");

var p = new Parser( filedata("grammer.txt") ),
	t = p.process( filedata("program.txt") ),
	v = t.evaluate( {"x":42} );

console.log( JSON.stringify(v,null,4) );