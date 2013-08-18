
module.exports = function(lib,src,data,callback){

	var undef = src.datatype.undefined.instance;
	var fnwrap = function(data){ return function(cb){ cb(null,data); }; };

	var result = {};

	result.assignment = function(left,operator,right,callback){
		lib.async.series(left.concat(right),callback,function(names){
			var value = names.pop(), result, last, scope;
			lib.async.series(names.reverse().map(function(name,i){
				return function(cb){
					if(name.length===1){
						lib.async.waterfall([
							function(cb2){ src.memory.get(name[0],cb2,true); },
							function(s,cb2){
								scope = s;
								new src.datatype.string(name[0],cb2);
							},
							function(n,cb2){
								name = n;
								if(operator[i]==="=") cb2(null,value);
								else src.datatype.$operator(operator[i].slice(0,-1),
									scope.operator.bind(scope,"[]",name), fnwrap(value), cb2);
							},
							function(val,cb2){
								scope.assign(name, value = val,cb2);
							}
						],cb);
					} else {
						lib.async.waterfall([
							// resolve all references but the last one
							function(cb2){
								last = name.pop();
								src.action.primary([],name[0],name.slice(1),cb2);
							},
							function(r,cb2){
								result = r;
								if(operator[i]==="=") cb2(null,value);
								else src.datatype.$operator(operator[i].slice(0,-1),
									result.operator.bind(result,"[]",last), fnwrap(value), cb2);
							},
							function(val,cb2){
								if(!result.assign) cb2("assignment.invalid-reference");
								else result.assign(last,value = val,cb2);
							}
						],cb);
					} // if name.length>1
				};
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
				else callback(null,undef);
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
				if(error==="~") callback(null,undef);
				else if(error) callback(error);
				else condition(fn);
			});
		};
		condition(fn);
	},

	result.forin = function(d,i,j,k,exp,then,callback){
		lib.async.series([i,j,k,exp],callback,function(r){
			lib.async.series(d?[
				src.memory.set.bind(null,r[0],undef),
				src.memory.set.bind(null,r[1],undef),
				src.memory.set.bind(null,r[2],r[3]),
			].slice(0,k?3:j?2:1):[],callback,function(){
				exp = r[3];
				i = fnwrap([r[0]]);
				j = j && fnwrap([r[1]]);
				k = k && fnwrap([r[2]]);
				if(!exp.iterate) callback("grammar.for-in.iterable-type-required");
				else exp.iterate(function(key,val,cb){
					lib.async.series([
						src.action.assignment.bind(null,[i],["="],fnwrap(key)),
						src.action.assignment.bind(null,[j],["="],fnwrap(val)),
					].slice(0,j?2:1).concat(then),cb);
				},function(e,r){
					if(e,r) callback(e,r);
					else callback(null,undef);
				});
			});
		});
	};

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
						return callback(null,undef);
				}
			} else {
				callback(null,result);
			}
		};
		val(fn);
	};

	result.primary = function(pre,name,post,callback){
		// var key = [name];
		var ac = arguments.callee, prev = null;
		var fn = function(error,result){
			if(error){
				callback(error);
			} else if(pre.length){
				// prefix operators are applied first
				switch(pre.pop()){
					case "new":
						var last = (post && post[post.length-1].id==="()" ? post.pop() : []);
						var context;
						return lib.async.waterfall([
							function(cb){ ac(pre,result,post,cb); },
							function(r,cb){ result = r; new src.datatype.object({},cb); },
							function(r,cb){ context = r; result.operator("()",[1,r,last],cb); }
						],function(e,r){
							if(!e || e==="function.return") callback(null,context);
							else callback(e,r);
						});
					case "delete":
						var last = post.pop();
						if(typeof(result)!=="string" || last && last.id==="()")
							callback("src.action.primary.delete.reference-required");
						else if(!last) src.memory.del(result,fn);
						else ac(pre,result,post,function(e,r){
							if(e) callback(e,r);
							else if(!r.delete) callback("src.action.primary.delete.invalid-scope");
							else r.delete(last,fn);
						});
						return;
				}
			} else if(post.length){
				var next = post[0];
				switch(next.id){
					case "[]":
						if(typeof(result)==="string") return src.memory.get(result,fn);
						prev = result;
						return result.operator(next.id, post.shift(), fn);
					case "()":
						if(typeof(result)==="string") return src.memory.get(result,fn);
						else return result.operator(next.id, [0,prev,post.shift()], function(error,result){
							if(error==="function.return") fn(null,result);
							else fn(error,undef);
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