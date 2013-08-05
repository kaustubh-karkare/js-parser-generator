
module.exports = function(lib,src,data){
	data.scope = [{}];
	data.access = [[0]];

	var access = function(name,del){
		var access = data.access[data.access.length-1];
		for(var i=0,j; i<access.length && !void(j=access[i]); ++i)
			if(name in data.scope[j])
				if(del){ delete data.scope[j][name]; return true; }
				else { return data.scope[j][name]; }
	};

	var result = {
		new : function(name,type,value){
			obj = { "type":type, "value":value };
			data.scope[data.access[data.access.length-1][0]][name] = obj;
		},
		get : function(name){
			var obj = access(name);
			return obj ? obj.value : new src.datatype.undefined();
		},
		set : function(name,value){
			var obj = access(name);
			if(obj){
				if(obj.type==="variable" || value instanceof src.datatype[obj.type])
					obj.value = value;
			} else {
				obj = { "type":"variable", "value":value };
				data.scope[data.access[data.access.length-1][0]][name] = obj;
			}
		},
		del : function(name){
			return access(name,true);
		}
	};
	return result;
};