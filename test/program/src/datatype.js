
var datatype = {};

datatype.undefined = function(lib,src,data,callback){
	var u = function(init, callback){
		if(!(this instanceof u)) return new u(callback);
		callback(null, this);
	};
	u.prototype = {
		"convert" : function(type,callback){
			if(type==="undefined") callback(null, this);
			else if(type==="boolean") callback(null, src.datatype.boolean.false);
			else if(type==="integer") callback(null, src.datatype.integer[0]);
			else if(type==="string") callback(null, src.datatype.string.empty);
		},
		"operator" : function(op,that,callback){
			callback("src.datatype.undefined.operator.unrecognized");
		}
	};
	new u(null,function(e,r){
		u.instance = r;
		callback(e,u);
	});
};

datatype.boolean = function(lib,src,data,callback){
	var b = function(init, callback){
		this.value = (init==="true")?true:false;
		callback(null, this);
	};
	b.prototype = {
		"convert" : function(type,callback){
			if(type==="undefined") callback(null, src.datatype.undefined.instance);
			else if(type==="boolean") callback(null, this);
			else if(type==="integer") callback(null, this.value ? src.datatype.integer[1] : src.datatype.integer[0] );
			else if(type==="string") new src.datatype.string(this.value?"true":"false",callback);
		},
		"operator" : function(op,that,callback){
			if(op==="!") callback(null, this.value ? b.false : b.true);
			else if(op==="&&") callback(null, this.value && that.value ? b.true : b.false);
			else if(op==="||") callback(null, this.value || that.value ? b.true : b.false);
			else if(op==="==") callback(null, this.value == that.value ? b.true : b.false);
			else if(op==="!=") callback(null, this.value != that.value ? b.true : b.false);
			else callback("src.datatype.boolean.operator.unrecognized");
		}
	};
	lib.async.series({
		"true": function(cb){ new b("true",cb); },
		"false": function(cb){ new b("false",cb); },
	}, function(e,result){
		if(!e) for(var key in result) b[key] = result[key];
		callback(e,b);
	})
};

datatype.integer = function(lib,src,data,callback){
	var i = function(init,callback){
		this.value = new lib.bigint(init);
		callback(null, this);
	};
	var unary = { "-":"neg" };
	var binary = {
		"+":"add","-":"sub","*":"mul","/":"div","%":"mod",
		"<":"lt", "<=": "lte", ">":"gt", ">=":"gte", "==":"eq", "!=":"neq"
	};
	i.prototype = {
		"convert" : function(type,callback){
			if(type==="undefined") callback(null, src.datatype.undefined.instance);
			else if(type==="boolean") callback(null, src.datatype.boolean[this.value.neq(i[0].value)?"true":"false"] );
			else if(type==="integer") callback(null, this);
			else if(type==="string") new src.datatype.string(this.value.str(),callback);
		},
		"operator" : function(op,that,callback){
			var temp = (that ? binary[op] : unary[op]);
			if(!temp) return callback("src.datatype.integer.operator.unrecognized");
			temp = this.value[temp](that && that.value);
			if(temp instanceof lib.bigint) new i(temp,callback);
			else callback(null,src.datatype.boolean[temp?"true":"false"]);
		}
	};
	lib.async.series({
		"0" : function(cb){ new i("0",cb); },
		"1" : function(cb){ new i("1",cb); },
		"NaN" : function(cb){ new i("NaN",cb); },
		"Infinity" : function(cb){ new i("Infinity",cb); },
		"-Infinity" : function(cb){ new i("-Infinity",cb); },
	}, function(e,result){
		if(!e) for(var key in result) i[key] = result[key];
		callback(e,i);
	});
};

datatype.string = function(lib,src,data,callback){
	var s = function(init,callback){
		this.value = init+"";
		callback(null, this);
	};
	var binary = {
		"+": function(that){ return this.value+that.value; },
		"==": function(that){ return this.value==that.value; },
		"!=": function(that){ return this.value!=that.value; },
		"<": function(that){ return this.value<that.value; },
		"<=": function(that){ return this.value<=that.value; },
		">": function(that){ return this.value>that.value; },
		">=": function(that){ return this.value>=that.value; },
	};
	s.prototype = {
		"convert": function(type,callback){
			if(type==="undefined") callback(null, src.datatype.undefined.instance);
			else if(type==="boolean") callback(null, src.datatype.boolean[this.value!==""?"true":"false"] );
			else if(type==="integer") new src.datatype.integer(this.value, callback);
			else if(type==="string") callback(null, this);
		},
		"operator": function(op,that,callback){
			var temp = binary[op];
			if(!temp) callback("src.datatype.string.operator.unrecognized");
			else if(typeof(temp=temp.call(this,that))==="boolean")
				callback(null,src.datatype.boolean[temp?"true":"false"]);
			else new src.datatype.string(temp,callback);
		}
	};
	new s("",function(e,r){
		if(!e) s.empty = r;
		callback(e,s);
	});
};



datatype.$operator = function(lib,src,data,callback){
	// datatypes in increasing order of datatype size
	var ordering = ["undefined","boolean","integer","string"];
	var rank = function(obj){
		for(var i=0; i<ordering.length; ++i)
			if(obj instanceof src.datatype[ordering[i]])
				return i;
		return -1;
	};

 	var fn = function(operator,left,right,callback){
 		// note: __proto__ is being used instead of constructor intentionally
		if(left.__proto__ === right.__proto__ || operator==="===" || operator==="!=="){
			if(left.__proto__ !== right.__proto__)
				callback(null,src.datatype.boolean[operator[0]==="!"?"true":"false"]);
			else left.operator(operator.substr(-2),right,callback);
		} else {
			var type = ordering[Math.max(rank(left),rank(right))];
			lib.async.series([
				left.convert.bind(left,type),
				right.convert.bind(right,type)
			],callback,function(result){
				result[0].operator(operator,result[1],callback);
			});
		}
	};

	callback(null,fn);
};



var result = function(lib,src,data,callback){
	var fns = {};
	Object.keys(datatype).forEach(function(type){
		fns[type] = function(cb){ datatype[type](lib,src,data,cb); };
	});
	lib.async.series(fns,callback);
};

for(var type in datatype)
	result[type] = datatype[type];

module.exports = result;