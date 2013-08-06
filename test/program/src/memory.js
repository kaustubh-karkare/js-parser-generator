
module.exports = function(lib,src,data){
	data.scope = {};

	var result = {
		new : function(name,type,value){
			obj = { "type":type, "value":value };
			data.scope[name] = obj;
		},
		get : function(name){
			var obj = data.scope[name];
			return obj ? obj.value : new src.datatype.undefined();
		},
		set : function(name,value){
			var obj = data.scope[name];
			if(obj){
				if(obj.type==="variable" || value instanceof src.datatype[obj.type])
					obj.value = value;
			} else {
				obj = { "type":"variable", "value":value };
				data.scope[name] = obj;
			}
		},
		del : function(name){
			return access(name,true);
		}
	};
	return result;
};