
var last = function(a){
	return function(x){
		if(arguments.length===0) return a[a.length-1];
		else return a[a.length-1] = x;
	};
};

module.exports = function(lib,src,data,callback){
	data.scope = [{}];
	data.scope.last = last(data.scope);

	data.access = [[0]];
	data.access.last = last(data.access);

	var find = function(type,name,value,callback){
		var a = data.access.last();
		for(var i=0; i<a.length; ++i)
			if(name in data.scope[a[i]])
				switch(type){
					case "get":
						return callback(null, data.scope[a[i]][name].value);
					case "set":
						var obj = data.scope[a[i]][name];
						if(obj.type==="variable" || value.__proto__ === src.datatype[obj.type].prototype)
							return callback(null, obj.value = value);
						else callback("src.memory.set.incorrect-type");
					case "del":
						var temp = data.scope[a[i]][name].value;
						delete data.scope[a[i]][name];
						return callback(null,temp);
				}
		var lenient = true;
		switch(type){
			case "get":
				if(lenient) return callback(null,src.datatype.undefined.instance);
				else return callback("src.memory.get.undefined");
			case "set":
				if(lenient) return callback(null,data.scope[a[0]][name]={"type":"variable","value":value});
				else return callback("src.memory.set.undefined");
			case "del":
				if(lenient) return callback(null,src.datatype.undefined.instance);
				else return callback("src.memory.del.undefined");
		}
	};

	var result = {
		"new" : function(type,name,value,callback){
			// note: overwrite of existing value possible
			if(src.datatype[type].prototype!==value.__proto__)
				return callback("src.memory.new.incorrect-type");
			data.scope[ data.access.last()[0] ][name] = {"type":type,"value":value};
			callback(null,value);
		},
		"get" : function(name,callback){ find("get",name,null,callback); },
		"set" : function(name,value,callback){ find("set",name,value,callback); },
		"del" : function(name){ find("del",name,null,callback); },

		"function" : {
			"new" : function(callback){
				callback(null,data.access.last());
			},
			"start" : function(access,labels,argsdata,callback){
				var obj = {};
				// TODO: add arguments array
				for(var i=0; i<labels.length; ++i)
					obj[labels[i]] = {
						"type": "variable",
						"value": argsdata[i] || src.datatype.undefined.instance
					};
				data.access.push([data.scope.push(obj)-1].concat(access));
				callback(null);
			},
			"end" : function(callback){
				if(data.access.length<=1) return callback("return.toplevel");
				data.access.pop();
				// TODO: garbage collection
				callback(null);
			}
		}

	};

	callback(null,result);
};