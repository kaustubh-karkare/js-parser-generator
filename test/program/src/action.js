
module.exports = function(lib,src,data,callback){

	var result = {};

	result.condition = function(condition, then, alt, callback){
		condition(function(e,r){
			if(e) callback(e);
			else r.convert("boolean",function(e,r){
				if(e) callback(e);
				else if(r.value) then(callback);
				else if(alt) alt(callback);
			});
		});
	};

	result.loop = function(condition, next, then, callback){
		// note: the list array only exists for debugging purposes
		var list = [], fn = function(error,result){
			lib.async.waterfall([
				function(cb){ cb(error,result); },
				function(result,cb){ result.convert("boolean",cb); },
				function(result,cb){ result.value ? then(cb) : cb("~"); },
				function(result,cb){ list.push(result); next ? next(cb) : cb(null); }
			],function(error){
				if(error==="~") callback(null,list);
				else if(error) callback(error);
				else condition(fn);
			});
		};
		condition(fn);
	},

	result.string = function(data, callback){
		var get = function(type, callback){
			return function(error,result){
				callback(error, error ? null : type+": "+result.value);
			};
		};
		var fn = function(data,callback){
			for(var type in src.datatype)
				if(data && data instanceof src.datatype[type])
					return data.convert("string",get(type,callback));
			if(data && typeof(data)==="object"){
				var result = Array.isArray(data) ? new Array(data.length) : {};
				Object.keys(data).forEach(function(key){
					result[key] = function(cb){ fn(data[key],cb); };
				});
				lib.async.parallel(result,callback);
			} else callback(null, data);
		};
		fn(data,callback);
	};

	result.unary = function(pre,val,post,callback){
		lib.async.series(pre.concat(post), callback, function(result){
			pre = result.slice(0,pre.length);
			post = result.slice(pre.length);
			var fn = function(error,result){
				if(error) callback(error);
				else if(pre.length>0){
					switch(pre.pop()){
						case "!":
							return lib.async.waterfall([
								function(cb){ result.convert("boolean", cb); },
								function(r,cb){ r.operator("!", null, cb); }
							],fn);
						case "+":
							return result.convert("integer", fn);
						case "-":
							return lib.async.waterfall([
								function(cb){ result.convert("integer", cb); },
								function(r,cb){ r.operator("-", null, cb); }
							],fn);
					}
				} else callback(null,result);
			};
			val(fn);
		});
	}

	callback(null, result);
};

module.exports.toString = function(){ return "[cat]" };