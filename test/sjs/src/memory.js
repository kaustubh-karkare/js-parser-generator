
var last = function(a){
	return function(x){
		if(arguments.length===0) return a[a.length-1];
		else return a[a.length-1] = x;
	};
};

module.exports = function(lib,src,data,callback){
	data.scope = [];
	data.scope.last = last(data.scope);

	data.access = [];
	data.access.last = last(data.access);

	var result = {

		"get" : function(name,callback,getscope){
			name = {value:name};
			var undef = src.datatype.undefined.instance, scope, first;
			lib.async.waterfall(data.access.last().map(function(a,i){
				return function(result,cb){
					if(i===0){ cb = result; first = data.scope[a]; }
					else if(result) return cb(null,result);
					if(getscope) scope = data.scope[a];
					if(name.value in data.scope[a].value)
						data.scope[a].operator("[]",name,cb);
					else cb(null,null);
				};
			}),callback,function(result){
				// in case scope is required for an undefined variable, return the first one
				if(getscope) callback(null,!result?first:scope);
				else callback(null,result||undef);
			});
		},
		"set" : function(name,value,callback){
			name = {value:name};
			// note: overwrite of existing value possible
			data.scope[data.access.last()[0]].assign(name,value,callback);
		},
		"del" : function(name,callback){
			name = {value:name};
			var t = src.datatype.boolean.true;
			lib.async.waterfall(data.access.last().map(function(a,i){
				return function(result,cb){
					if(i===0) cb = result;
					else if(result===t) return cb(null,result);
					data.scope[a].delete(name,cb);
				};
			}),callback);
		},

		"function" : {
			"new" : function(callback){
				callback(null,data.access.last());
			},
			"start" : function(callee,access,labels,argsdata,callback){
				var undef = src.datatype.undefined.instance, argslen;
				lib.async.waterfall([
					function(cb){ new src.datatype.integer(argsdata.length,cb); },
					function(al,cb){
						argslen = al;
						if(data.access.length===0) cb(null,null);
						else cb(null,data.scope[data.access.last()[0]].value.arguments.value.callee);
					},
					function(caller,cb){
						var keys = argsdata.map(function(v,i){ return {"value":i}; }), vals = argsdata;
						if(data.access.length){
							keys.push({"value":"length"},{"value":"callee"},{"value":"caller"});
							vals.push(argslen, callee || undef, caller || undef);
						}
						new src.datatype.object({ key: keys, val: vals },cb);
					},
					function(args,cb){
						var keys = [{"value":"arguments"}], vals = [args];
						for(var i=0; i<labels.length; ++i)
							keys.push({"value":labels[i]}),
							vals.push(argsdata[i]||undef);
						new src.datatype.object({ key:keys, val:vals },cb);
					},
					function(local,cb){ local.assign({"value":"local"},local,cb); },
					// the object.prototype.assign function returns the assigned value
					function(local,cb){
						data.access.push([data.scope.push(local)-1].concat(access));
						cb(null);
					}
				], callback);
			},
			"end" : function(callback){
				data.access.pop();
				// TODO: garbage collection
				callback(null);
			}
		}

	};

	callback(null,result);
};