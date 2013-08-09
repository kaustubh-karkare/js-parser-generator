
// Based on https://github.com/caolan/async

var obj2array = function(source,obj,error,callback){
	if(typeof(obj)==="object" && obj!==null){
		var keys = Object.keys(obj);
		var vals = keys.map(function(key){ return obj[key]; });
		var result = {};
		source(vals,function(e,_result){
			if(e){ typeof(error)==="function" && error.apply(this,arguments); return; }
			keys.forEach(function(key,i){ result[key] = _result[i]; });
			typeof(callback)==="function" && callback.call(this,null,result);
		});
		return true;
	} else return false;
};

var nextTick = function(fn){
	if(typeof(setImmediate)==="function") setImmediate(fn);
	else setTimeout(fn,0);
};

var series = function(list,error,callback,wf){
	// if(arguments.length===4 && arguments.callee.caller!==waterfall) wf = false;
	if(typeof(error)!=="function") error = null;
	if(typeof(callback)!=="function") callback = error;
	if(Array.isArray(list)){
		var i = -1, context = this;
		if(!wf) var result = [];
		(function(e){
			if(e){ error && error.apply(context,arguments); return; }
			var args = Array.prototype.slice.call(arguments,1);
			if(!wf && i!==-1) result.push(args.length===0 ? null : args.length===1 ? args[0] : args);
			while(++i<list.length && typeof(list[i])!=="function") !wf && result.push(null);
			var once = true, fn = arguments.callee;
			nextTick(function(){ // to avoid reaching maximum function stack size
				if(once) once = false; else return;
				if(i<list.length)
					if(wf) list[i].apply(context,args.concat(fn));
					else list[i].call(context,fn);
				else if(callback)
					if(wf) callback.apply(context,error===callback?[null].concat(args):[args]);
					else callback.apply(context,error===callback?[null,result]:[result]);
			});
		})(null);
	} else return obj2array.call(this,arguments.callee,list,error,callback);
};

var waterfall = function(list,error,callback){ return series(list,error,callback,true); };

var parallel = function(list,error,callback){
	if(arguments.length===2) callback = error;
	if(typeof(error)!=="function") error = null;
	if(typeof(callback)!=="function") callback = null;
	if(Array.isArray(list)){
		var result = new Array(list.length), done = -1, context = this;
		var process = function(index){
			return function(e){
				if(e){ error && error.apply(context,arguments); return; }
				var args = Array.prototype.slice.call(arguments,1);
				if(index!==-1) result[index] = args.length===0 ? null : args.length===1 ? args[0] : args ;
				if(++done===result.length) callback && callback.apply(context,error===callback?[null,result]:[result]);
			};
		};
		for(var i=0; i<list.length; ++i)
			if(typeof list[i]!=="function") ++done;
			else list[i](process(i));
		process(-1)(null);
	} else return obj2array.call(this,arguments.callee,list,error,callback);
};

var async = module.exports = {
	nextTick : nextTick,
	series : series,
	parallel : parallel,
	waterfall : waterfall,
};

/*
var fns = {
	"one":   function(cb){ setTimeout(function(){ console.log(1); cb(null,1); },100) },
	"four":  function(cb){ setTimeout(function(){ console.log(4); cb(null,4); },400) },
	"two":   function(cb){ setTimeout(function(){ console.log(2); cb(null,2); },200) },
	"five":  function(cb){ setTimeout(function(){ console.log(5); cb(null,5); },500) },
	"three": function(cb){ setTimeout(function(){ console.log(3); cb(null,3); },300) }
};
var echo = function(){ console.log(JSON.stringify(arguments)); };
async.series(fns,echo);
// async.parallel(fns,echo);

var echo = function(x){ console.log(x); };
var start = function(cb){ echo(arguments); cb(null,1); },
	double = function(x,cb){ echo("2 * "+x+" = "+2*x); cb(null,2*x); };
for(var fns=[start], i=0; i<8; ++i) fns.push(double);
async.waterfall(fns,function(cb){ echo(arguments); });
*/
