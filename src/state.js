
var State = function(parser,data){
	this.parser = parser;
	this.data = data;
	this.index = 0;
	this.debug = false;

	this.localdata = [];
	this.namedata = [];
	this.alternative = [];
	this.redirect = [];
};

State.prototype.push = function(data){
	this.localdata.push(data);
	return data;
};

State.prototype.pop = function(){
	return this.localdata.pop();
};

State.prototype.top = function(data){
	return this.localdata[this.localdata.length-1] = data;
};

var clone = function(obj){
	var result = obj; // null, undefined, number, string, regexp, function
	if(obj && typeof(obj)==="object"){
		var a = Array.isArray(obj);
		result = a ? new Array(obj.length) : {};
		for(var key in obj)
			if(obj.hasOwnProperty(key))
				result[key] = arguments.callee(obj[key]);
		if(!a) result.__proto__ = obj.__proto__; // inheritance
	}
	return result;
};

State.prototype.save = function(){
	var that = {
		"localdata" : clone(this.localdata), // not loaded, as this is set during redirection itself
		"index" : this.index,
		"namedata" : clone(this.namedata)
	};
	this.alternative.push(that);
	this.log("<alternative>",that.localdata.slice(-1)[0]);
	return that.localdata.slice(-1)[0];
};

State.prototype.load = function(){
	var that = this.alternative.pop();
	this.index = that.index;
	this.namedata = that.namedata;
	this.log("<restored>",that.localdata.slice(-1)[0]);
};

var equals = function(obj1, obj2){ return JSON.stringify(obj1)===JSON.stringify(obj2); };

State.prototype.mismatch = function(){
	if(this.alternative.length===0){
		for(var i=0; i<this.localdata.length; ++i)
			this.redirect.push(null);
	} else {
		var that = this.alternative[this.alternative.length-1];
		for(var i=0; i<this.localdata.length; ++i)
			if(!equals(this.localdata[i],that.localdata[i])) break;
		for(var j=i+1; j<this.localdata.length; ++j) this.redirect.push(null);
		this.redirect = this.redirect.concat(that.localdata.slice(i));
		this.log("<redirect-init>",this.redirect);
		if(this.redirect.length===0) this.load(); // delayed so that it can be ignored midway
	}
};

State.prototype.local = function(initial){
	if(this.redirect.length===0) return initial;
	else {
		this.log("<redirect>",this.redirect);
		if(this.redirect.length===1) this.load();
		return this.redirect.shift();;
	}
};

State.prototype.ignore = function(){
	this.log("<ignore>",this.redirect);
	this.redirect = [];
};

State.prototype.log = function(){
	var args = Array.prototype.slice.call(arguments)
			.map(function(x){ return JSON.stringify(x) }),
		offset = ( !isNaN(parseInt(args[0])) ? parseInt(args.shift()) : 0 ),
		tab = new Array(this.localdata.length+offset).join("  ");
	if(this.debug) console.log(tab+args.join(" "));
};

module.exports = State;