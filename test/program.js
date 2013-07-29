
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

var parser = timer(function(){
	return new pg( filedata("grammar.txt"), {} );
});
// print("Generated Parser",parser[0],1);

var program = filedata("code.txt");
print("Input Program",program);

var syntaxtree = timer(function(){
	return parser[0].parse( program );
});
// print("Syntax Tree",syntaxtree[0],1);

var value = timer(function(){
	return syntaxtree[0].execute();
});
print("Execution Result",value[0],1);

print("Processing Times",{
	"Parser Generation": parser[1],
	"Program Compilation": syntaxtree[1],
	"Program Execution": value[1]
},1);