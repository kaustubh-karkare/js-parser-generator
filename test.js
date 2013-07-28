
var fs = require("fs"),
	filedata = function(path){ return fs.readFileSync(path).toString(); };

var json = function(x,y){ console.log( "\n"+x+"\n\n"+JSON.stringify(y,null,"	")+"\n\n" ); };

var generator = require("./src/");

var parser = generator.buildParser( filedata("grammar.txt") );
// json("Generated Parser",parser);

var syntaxtree = parser.parse( filedata("program.txt") );
// json("Syntax Tree",syntaxtree);

var value = syntaxtree.execute();
json("Execution Result",value);