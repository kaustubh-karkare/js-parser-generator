
module.exports = function(lib,src,data,callback){

	var result = {};

	result.assignment = function(left,operator,right,callback){
		lib.async.series(left.concat(right),callback,function(names){
			var value = names.pop(), result;
			lib.async.series(names.reverse().map(function(name,i){
				if(name.length>1){
					return function(cb){
						lib.async.waterfall([
							function(cb2){ src.action.primary([],name[0],name.slice(1,-1),cb2); },
							function(r,cb2){
								result = r;
								if(operator[i]==="=") cb2(null,null);
								else result.operator("[]",name[name.length-1],cb2);
							},
							function(current,cb2){
								if(operator[i]==="=") cb2(null,value);
								else src.datatype.$operator(operator[i].slice(0,-1),current,value,cb2);
							},
							function(val,cb2){ result.assign(name[name.length-1],value = val,cb2); }
						],cb);
					};
				} else if(operator[i]==="="){
					return function(cb){ src.memory.set(name[0],value,cb); };
				} else {
					return function(cb){
						lib.async.waterfall([
							function(cb2){ src.memory.get(name[0],cb2); },
							function(current,cb2){ src.datatype.$operator(operator[i].slice(0,-1),current,value,cb2); },
							function(next,cb2){ src.memory.set(name[0],value=next,cb2); }
						],cb);
					};
				}
			}),callback,function(){ callback(null,value); });
		});
	};

	result.condition = function(condition, then, alt, callback){
		condition(function(e,r){
			if(e) callback(e);
			else r.convert("boolean",function(e,r){
				if(e) callback(e);
				else if(r.value) then(callback);
				else if(alt) alt(callback);
				else callback(null,src.datatype.undefined.instance);
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
				if(error==="~") callback(null,src.datatype.undefined.instance);
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

	result.unary = function(operator,val,callback){
		lib.async.series(operator, callback, function(operator){
			var fn = function(error,result){
				if(error) callback(error);
				else if(operator.length){
					switch(operator.pop()){
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
						case "typeof":
							return new src.datatype.$gettype(result,callback);
						case "void":
							return callback(null,src.datatype.undefined.instance);
					}
				} else callback(null,result);
			};
			val(fn);
		});
	};

	result.primary = function(pre,name,post,callback){
		// var key = [name];
		var fn = function(error,result){
			if(error) callback(error);
			else if(post.length){
				var next = post[0];
				switch(next.id){
					case "[]":
						if(typeof(result)==="string") return src.memory.get(result,fn);
						else return result.operator(next.id, post.shift(), fn);
					case "()":
						if(typeof(result)==="string") return src.memory.get(result,fn);
						else return result.operator(next.id, post.shift(), function(error,result){
							if(error==="function.return") fn(null,result);
							else fn(error,result);
						});
				}
			} else {
				if(typeof(result)==="string") return src.memory.get(result,fn);
				else callback(null,result);
			}
		};
		fn(null, name);
		// src.memory.get(name,callback);
	};

	callback(null, result);
};

module.exports.toString = function(){ return "[cat]" };