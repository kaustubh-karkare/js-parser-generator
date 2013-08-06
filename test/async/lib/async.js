
var async = {
	_obj2array : function(source,obj,callback){
		if(typeof(obj)==="object" && obj!==null){
			var keys = Object.keys(obj);
			var vals = keys.map(function(key){ return obj[key] });
			var result = {};
			source(vals,function(error,_result){
				if(error){ callback.apply(null,arguments); return; }
				keys.forEach(function(key,i){ result[key] = _result[i]; });
				callback(null,result);
			});
			return true;
		} else return false;
	},
	series : function(list,callback){
		var c = (typeof(callback)==="function");
		if(Array.isArray(list)){
			var result = [], process = function(i){
				if(typeof(list[i])==="function") list[i](function(error){
					if(!result) return;
					if(error){ c && callback.apply(null,arguments); result = null; return; }
					result.push(arguments.length===2 ? arguments[1] : Array.prototype.slice.call(arguments,1));
					if(++i === list.length){ c && callback(null,result); result = null; return; }
					else process(i);
				});
			};
			process(0);
			return true;
		} else return this._obj2array(arguments.callee,list,callback);
	},
	parallel : function(list,callback){
		var c = (typeof(callback)==="function");
		if(Array.isArray(list)){
			var result = new Array(list.length), cnt = 0;
			var cb = function(i){
				return function(error){
					if(!result) return;
					if(error){ c && callback.apply(null,arguments); result = null; return; }
					result[i] = (arguments.length===2 ? arguments[1] : Array.prototype.slice.call(arguments,1));
					if(++cnt === list.length){ c && callback(null,result); result = null; }
				};
			};
			for(var i=0; i<list.length; ++i)
				if(typeof(list[i])==="function")
					list[i](cb(i));
			return true;
		} else return this._obj2array(arguments.callee,list,callback);
	}
};

module.exports = async;

/*
var fns = {
	"one":   function(cb){ setTimeout(function(){ console.log(1); cb(null,1); },100) },
	"four":  function(cb){ setTimeout(function(){ console.log(4); cb(null,4); },400) },
	"two":   function(cb){ setTimeout(function(){ console.log(2); cb(null,2); },200) },
	"five":  function(cb){ setTimeout(function(){ console.log(5); cb(null,5); },500) },
	"three": function(cb){ setTimeout(function(){ console.log(3); cb(null,3); },300) }
};
var echo = function(){ console.log(JSON.stringify(arguments)); };
// async.series(fns,echo);
async.parallel(fns,echo);
*/