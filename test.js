
var fs = require("fs"),
	filedata = function(path){ return fs.readFileSync(path).toString(); };

var json = function(x,y){ console.log( "\n"+x+"\n\n"+JSON.stringify(y,null,"	")+"\n\n" ); };

var Parser = require("./src/parser");

var p = new Parser( filedata("grammer.txt") );
// json("Generated Parser",p);

var t = p.parse( filedata("program.txt") );
// json("Syntax Tree",t);

var v = t.execute();
json("Execution Result",v);
json("Execution Environment",t.env);