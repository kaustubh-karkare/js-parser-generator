
var fs = require("fs"), path = require("path");

var filedata = function(relpath){
	return fs.readFileSync(path.join(__dirname+path.sep,relpath)).toString();
};

var print = function(heading,data,type){
	console.log( "\n"+heading+"\n"+new Array(heading.length+1).join("=")+"\n");
	if(type) console.log((type===2?JSON.stringify(data,null,"    "):data)+"\n" );
	else console.log("[suppressed]");
};

var Timer = function(){
	var start = new Date().getTime();
	return function(){ return (new Date().getTime()-start)+" ms"; };
};

var requiredir = function(relpath,literal){
	var dirpath = path.join(__dirname+path.sep,relpath);
	if(!fs.existsSync(dirpath) || !fs.statSync(dirpath).isDirectory()) return null;
	var list = fs.readdirSync(path.join(dirpath));
	var result = {};
	for(var i=0,name; name=list[i]; ++i){
		var filepath = path.join(dirpath+path.sep,name), stat = fs.statSync(filepath);
		if(stat.isFile())
			if(!literal && name.slice(-3)===".js") result[name.slice(0,-3)] = require(filepath);
			else result[name] = fs.readFileSync(filepath).toString();
		else if(stat.isDirectory())
			result[name] = arguments.callee(path.join(relpath+path.sep,name),literal);
	}
	return result;
};

////////// MAIN //////////

var pg = require("../../src/"), timer;

var grammar = filedata("./grammar.js");
timer = Timer();
var parser = pg.buildParser(grammar,{ debug:0, lazyeval:1, async:1 });
print("Generated Parser ("+timer()+")",parser,0);

var async = require("./lib/async"),
	tests = requiredir("test",true);
async.series(Object.keys(tests).map(function(name,i){
	return function(callback){
		// if(i!==0) return callback(null);

		var program = tests[name];
		print("Input Program : "+name,program,1);
		var args = [requiredir("lib"),requiredir("src"),{}];

		timer = Timer();
		var syntaxtree = parser.parse(program,args);
		print("Syntax Tree ("+timer()+")",syntaxtree.ast,0);

		timer = Timer();
		syntaxtree(function(error,result){
			print("Execution Result ("+timer()+")",error || result,2);
			// print("Program Data",args[2],2);
			callback(null);
		});

	};
}));