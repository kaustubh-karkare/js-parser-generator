
var fs = require("fs"), path = require("path");
var filedata = function(relpath){
	return fs.readFileSync(path.join(__dirname+path.sep,relpath)).toString();
};

process.stdin.resume();
process.stdin.setEncoding('utf8');
var input = function(message,callback){
	process.stdout.write(message);
	process.stdin.once("data",callback);
};

var grammar = filedata("grammar.js"), code = "1 + 25 * 20 + 4 / 2 - 13%10 + input";
var config = {"lazyeval":1,"async":1}, args = [require("./lib/async"),input];

var pg = require("../../src"),
	parser = pg.buildParser(grammar,config),
	result = parser.parse(code,args);
	
console.log(code);
result(function(error,result){
	console.log(result);
	process.stdin.pause();
});