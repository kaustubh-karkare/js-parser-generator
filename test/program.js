
var fs = require("fs"), pathsep = require("path").sep;
var filedata = function(path){
	return fs.readFileSync(__dirname+pathsep+path).toString();
};
var print = function(heading,data,json){
	console.log( "\n"+heading+"\n"+new Array(heading.length+1).join("=")+"\n");
	console.log((json?JSON.stringify(data,null,"    "):data)+"\n" );
};
var timer = function(fn){
	var time = new Date().getTime();
	var result = fn();
	time = new Date().getTime() - time;
	return [result,time+" ms"];
}


var pg = require("../src/");

var grammar = filedata("grammar.js"),
	program = filedata("code.txt");

var parser = timer(function(){ return pg.buildParser(grammar,{ debug:0, lazyeval:1 }); });
// print("Generated Parser",parser[0],1);

print("Input Program",program);

var args = [{"bignumber":require("./lib/bignumber")}];

var syntaxtree = timer(function(){ return parser[0].parse(program,args); });
// print("Syntax Tree",syntaxtree[0].ast,1);

var value = typeof(syntaxtree[0])!=="function" ? ["<error>"] : timer(function(){ return syntaxtree[0](); });
print("Execution Result",value[0].toString(),1);

print("Processing Times",{
	"Parser Generation": parser[1],
	"Program Compilation": syntaxtree[1],
	"Program Execution": value[1]
},1);