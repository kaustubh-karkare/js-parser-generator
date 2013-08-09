
module.exports = function(lib,src,data,callback){
	data.scope = {};

	var result = {
		new : function(name,type,value,callback){
			obj = { "type":type, "value":value };
			data.scope[name] = obj;
			callback(null,value);
		},
		get : function(name,callback){
			var obj = data.scope[name];
			if(obj) callback(null,obj.value);
			else callback("src.memory.get.undefined");
		},
		set : function(name,value,callback){
			var obj = data.scope[name];
			if(obj){
				if(obj.type==="variable" || value instanceof src.datatype[obj.type])
					obj.value = value;
			} else {
				obj = { "type":"variable", "value":value };
				data.scope[name] = obj;
			}
			callback(null,value);
		},
		del : function(name){
			if(name in data.scope) delete data.scope[name];
			callback(null);
		}
	};

	callback(null,result);
};