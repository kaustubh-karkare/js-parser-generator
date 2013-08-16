
var datatype = {};

datatype.undefined = function(lib,src,data,callback){
	var u = function(init, callback){
		if(!(this instanceof u)) return new u(callback);
		this.type = "undef";
		callback(null, this);
	};
	u.prototype = {
		"convert" : function(type,callback){
			if(type==="undefined") callback(null, this);
			else if(type==="boolean") callback(null, src.datatype.boolean.false);
			else if(type==="integer") callback(null, src.datatype.integer[0]);
			else if(type==="array") callback(null, src.datatype.array.empty);
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
		try {
			this.value = new lib.bigint(init);
			callback(null, this);
		} catch(e){
			callback("src.datatype.integer.constructor.invalid");
		}
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

datatype.array = function(lib,src,data,callback){
	var a = function(init,callback){
		this.value = init.slice(0);
		callback(null, this);
	};
	a.prototype = {
		"convert": function(type,callback){
			if(type==="undefined") callback(null, src.datatype.undefined.instance);
			else if(type==="boolean") callback(null, src.datatype.boolean.true );
			else if(type==="integer") callback(null, src.datatype.integer.nan );
			else if(type==="array") callback(null, this);
			else if(type==="string") new src.datatype.string("[array]",callback);
		},
		"operator": function(op,that,callback){
			if(op!=="[]") return callback("src.datatype.array.operator.unrecognized");
			if(that.value==="length") new src.datatype.integer(this.value.length,callback);
			else that.convert("integer",(function(error,result){
				if(error) callback(error,result);
				else if(that.value.indexOf("Infinity")!==-1 || this.value==="NaN")
					callback("src.datatype.array.operator.invalid-index");
				else callback(null, this.value[that.value] || src.datatype.undefined.instance );
			}).bind(this));
		},
		"assign": function(key,val,callback){
			var i = (key.value==="length" ? val : key);
			i.convert("integer",(function(error,result){
				if(error) return callback(error,result);
				i = result.value.num();
				if(i===Infinity || i===-Infinity || i!==i || i<0)
					callback("src.datatype.array.assign.invalid-index");
				else if(key.value==="length"){
					if(i<=this.value.length) this.value.length = i;
					else while(this.value.length<i)
						this.value.push(src.datatype.undefined.instance);
					callback(null, result);
				} else callback(null, this.value[i] = val );
			}).bind(this));
		},
		"delete": function(key,callback){
			key.convert("integer",(function(error,result){
				if(error) return callback(error,result);
				var i = result.value.num(),
					j = this.value[i] || src.datatype.undefined.instance;
				this.value[i] = src.datatype.undefined.instance;
				callback(null,j);
			}).bind(this));
		}
	};
	new a([],function(e,r){
		if(!e) a.empty = r;
		callback(e,a);
	});
};

datatype.object = function(lib,src,data,callback){
	var x = function(init,callback){
		this.value = {};
		if(init.key)
			for(var i=0;i<init.key.length;++i)
				this.value[init.key[i].value] = init.val[i];
		callback(null, this);
	};
	x.prototype = {
		"convert": function(type,callback,start){
			var self = this;
			if(type==="undefined") callback(null, src.datatype.undefined.instance);
			else if(type==="boolean") callback(null, src.datatype.boolean.true );
			else if(type==="integer") callback(null, src.datatype.integer.nan );
			else if(type==="object") callback(null, this);
			else if(type==="string") new src.datatype.string("[object]",callback);
		},
		"operator": function(op,that,callback){
			if(op!=="[]") return callback("src.datatype.object.operator.unrecognized");
			callback(null, this.value[that.value] || src.datatype.undefined.instance);
		},
		"assign": function(key,val,callback){
			this.value[key.value] = val;
			callback(null,val);
		},
		"delete": function(key,callback){
			var temp = this.value[key.value];
			delete this.value[key.value];
			callback(null,temp);
		}
	};
	callback(null,x);
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

datatype.function = function(lib,src,data,callback){
	var f = function(init,callback){
		this.args = init.args;
		this.body = init.body;
		this.str = init.str;
		src.memory.function.new((function(error,result){
			if(!error) this.access = result;
			callback(error, this);
		}).bind(this));
	};
	f.prototype = {
		"convert": function(type,callback){
			if(type==="undefined") callback(null, src.datatype.undefined.instance);
			else if(type==="boolean") callback(null, src.datatype.boolean.true );
			else if(type==="integer") callback(null, src.datatype.integer.nan );
			else if(type==="string") new src.datatype.string( this.str, callback );
			else if(type==="function") callback(null, this);
		},
		"operator": function(op,that,callback){
			if(op!=="()") return callback("src.datatype.function.operator.unrecognized");
			lib.async.series([
				src.memory.function.start.bind(null,this,this.access,this.args,that[1]),
				src.memory.set.bind(null,"this",that[0] || src.datatype.undefined.instance),
				this.body
			],function(error,result){
				src.memory.function.end(function(error2){
					if(error||error2) callback(error||error2,result);
					else callback(null, result[1] || src.datatype.undefined.instance);
				});
			});
		}
	};
	new f({"args":[],"body":function(){},"str":"[function:no-operation]"},function(e,r){
		f.noop = r;
		callback(null,f);
	});
};

// Auxiliary Functions

// note: instanceof checks dont work, so prototype comparisons are being used.

datatype.$gettype = function(lib,src,data,callback){
	var result = function(value,callback){
		for(var type in src.datatype)
			if(type[0]!=="$" && value.__proto__===src.datatype[type].prototype)
				return new src.datatype.string(type,callback);
		callback("src.datatype.$gettype.unknown");
	};
	callback(null,result);
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
		if(left.__proto__ === right.__proto__ || operator==="===" || operator==="!=="){
			if(left.__proto__ !== right.__proto__)
				callback(null,src.datatype.boolean[operator[0]==="!"?"true":"false"]);
			else left.operator(operator.slice(0,2),right,callback);
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