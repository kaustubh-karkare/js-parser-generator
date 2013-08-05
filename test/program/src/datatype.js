
var datatype = {};

var gettype = function(item){
	for(var type in datatype)
		if(item instanceof datatype[type])
			return type;
	return null;
};

datatype.undefined = function(lib){
	var u = function(){
		if(!(this instanceof u)) return new u();
	};
	return u;
};

datatype.boolean = function(lib){
	var b = function(init, type){
		type = type || gettype(init);
		if(type==="undefined") this.value = false;
		else if(type==="boolean") this.value = init.value;
		else if(type==="integer") this.value = !init.value.eq(datatype.integer.zero.value);
		else if(type==="string") this.value = (init.value!="");
		else this.value = (init==="true");
	};
	b.true = new b("true");
	b.false = new b("false");
	b.prototype.operator = function(operator,that){
		if(operator==="!") return this.value ? b.false : b.true;
		else if(operator==="&&") return this.value && that.value ? b.true : b.false;
		else return this.value || that.value ? b.true : b.false;
	}
	return b;
};

datatype.integer = function(lib){
	var bigint = lib.bigint;
	var n = function(init,type){
		type = type || gettype(init);
		if(type==="undefined") this.value = n.nan.value;
		else if(type==="boolean") this.value = (init.value ? n.one.value : n.zero.value);
		else if(type==="integer") this.value = init.value;
		else if(type==="string")
			try { this.value = new bigint(init.value); }
			catch(e){ this.value = n.nan.value; }
		else if(init instanceof bigint) this.value = init;
		else this.value = new bigint(init);
	};
	n.zero = new n(0);
	n.one = new n(1);
	n.nan = new n("NaN");
	n.pinf = new n("+Infinity");
	n.ninf = new n("-Infinity");
	var unary = { "-":"neg" };
	var binary = {
		"+":"add","-":"sub","*":"mul","/":"div","%":"mod", "**":"pow",
		"<":"lt", "<=": "lte", ">":"gt", ">=":"gte", "==":"eq", "!=":"neq"
	};
	n.prototype.operator = function(operator,that){
		var temp = that===undefined ? unary[operator] : binary[operator];
		if(!temp) throw new Error("datatype.integer.operation.not-implemented");
		if(typeof(temp)==="string") temp = this.value[temp](that && that.value);
		else if(typeof(temp)==="function") temp = temp.call(this,that);
		if(temp instanceof bigint) return new n(temp);
		else if(typeof(temp)==="boolean") return datatype.boolean[temp];
	};
	return n;
};

datatype.string = function(lib){
	var s = function(init,type){
		type = type || gettype(init);
		if(type==="undefined") this.value = "undefined";
		else if(type==="boolean") this.value = (init.value ? "true" : "false");
		else if(type==="integer") this.value = init.value.toString();
		else if(type==="string") this.value = init.value;
		else this.value = init+"";
	};
	var type1 = {
		"+": function(that){ return this.value+that.value; },
		"==": function(that){ return this.value==that.value; },
		"!=": function(that){ return this.value!=that.value; },
		"<": function(that){ return this.value<that.value; },
		"<=": function(that){ return this.value<=that.value; },
		">": function(that){ return this.value>that.value; },
		">=": function(that){ return this.value>=that.value; },
	};
	var type2 = ["-","*","/","%","**"];
	s.prototype.operator = function(operator,that){
		if(x=type1[operator]) return typeof(x=x.call(this,that))==="string" ? new s(x) : datatype.boolean[x];
		else if(type2.indexOf(operator)) return new datatype.integer.nan;
		else throw new Error("datatype.string.operation.not-implemented");
	};
	s.prototype.toString = function(){ return this; };
	return s;
};

module.exports = function(lib,src){
	for(var type in datatype)
		datatype[type] = datatype[type](lib);
	return datatype;
};
