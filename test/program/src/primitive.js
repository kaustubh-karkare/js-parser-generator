
var primitive = {};

var gettype = function(item){
	for(var type in primitive)
		if(item instanceof primitive[type])
			return type;
	return null;
};

primitive.boolean = function(lib){
	var b = function(init, type){
		type = type || gettype(init);
		if(type==="boolean") this.value = init.value;
		else if(type==="number") this.value = !init.value.eq(0);
		else this.value = (init==="true");
	};
	b.true = new b("true");
	b.false = new b("false");
	b.prototype.operator = function(operator,that){
		if(operator==="&&") return this.value && that.value ? b.true : b.false;
		else return this.value || that.value ? b.true : b.false;
	}
	b.prototype.toString = function(){ return this.value?"true":"false"; };
	return b;
};

primitive.number = function(lib){
	var bignum = lib.bignumber;
	var translate = {
		"+":"plus","-":"minus","*":"times","/":"div","%":"mod",
		"<":"lt", "<=": "lte", ">":"gt", ">=":"gte", "==":"eq",
		"!=":function(that){ return !this.value.eq(that.value); }
	};
	var n = function(init,type){
		type = type || gettype(init);
		if(type==="boolean") this.value = (init.value ? n.one : n.zero);
		else if(type==="number") this.value = bignum(init.value);
		else this.value = bignum(init);
	};
	n.zero = new n(0);
	n.one = new n(1);
	n.prototype.operator = function(operator,that){
		var temp = translate[operator];
		if(!temp) throw new Error("Not Implemented");
		if(typeof(temp)==="string")
			temp = this.value[temp](that.value);
		else if(typeof(temp)==="function")
			temp = temp.call(this,that);
		if(temp instanceof bignum) return new n(temp);
		else if(typeof(temp)==="boolean") return primitive.boolean[temp];
	};
	n.prototype.toString = function(){ return this.value.toString(); };
	return n;
};

module.exports = function(lib,src){
	for(var type in primitive)
		primitive[type] = primitive[type](lib);
	return primitive;
};
