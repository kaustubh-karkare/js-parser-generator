
var util = require("./util");

var State = function(parser,data){
	this.parser = parser;
	this.data = data;
	this.index = 0;

	this.localdata = [];
	this.namedata = [];
	this.alternative = [];
	this.redirect = [];
	// this.expected = [];
};

State.prototype.push = function(data){
	this.localdata.push(data);
	return data;
};

State.prototype.pop = function(){
	return this.localdata.pop();
};

State.prototype.top = function(data){
	if(!data) return this.localdata[this.localdata.length-1];
	else return this.localdata[this.localdata.length-1] = data;
};

State.prototype.save = function(){
	var that = {
		"localdata" : util.clone(this.localdata),
		"index" : this.index,
		"namedata" : util.clone(this.namedata)
	};
	this.alternative.push(that);
	this.log(2,"<alternative>",that.localdata.slice(-1)[0]);
	return that;
};

State.prototype.load = function(){
	var that = this.alternative.pop();
	// localdata not loaded, as this is set during redirection itself
	this.index = that.index;
	this.namedata = that.namedata;
	this.log(2,1,"<restored>",that.localdata.slice(-1)[0]);
};

State.prototype.clone = function(){
	var that = {};
	for(var key in this)
		if(Array.isArray(this[key])) that[key] = util.clone(this[key]);
		else that[key] = this[key];
	that.__proto__ = this.__proto__; // make this object an instance of the State class
	return that;
};

State.prototype.diff = function(that){
	var result = {};
	for(var key in this)
		if(Array.isArray(this[key])){
			var k = 0; result[key] = {};
			for(var i=0; i<this[key].length; ++i)
				if(JSON.stringify(this[key][i])!==JSON.stringify(that[key][i])){
					result[key]["+"+i] = this[key][i];
					if(that[key][i]!==undefined) result[key]["-"+i] = that[key][i];
					k=1;
				}
			if(this[key].length!==that[key].length)
				{ result[key].length = this[key].length - that[key].length; k=1; }
			if(!k) delete result[key];
		}
	result.index = this.index - that.index
	return result;
};

State.prototype.add = function(diff){
	that = this;
	for(var key in diff)
		if(Array.isArray(this[key])){
			if("length" in diff[key]) this[key].length += diff[key].length;
			Object.keys(diff[key]).forEach(function(i){
				if(i[0]==="+") that[key][i.substr(1)] = diff[key][i];
			});
		}
	this.index += diff.index;
};

State.prototype.sub = function(diff){
	that = this;
	for(var key in diff)
		if(Array.isArray(this[key])){
			if("length" in diff[key]) this[key].length -= diff[key].length;
			Object.keys(diff[key]).forEach(function(i){
				if(i[0]==="-") that[key][i.substr(1)] = diff[key][i];
			});
		}
	this.index -= diff.index;
};

State.prototype.match = function(unit){
	this.index += unit.length;
	// this.expected = [];
	return unit;
};

State.prototype.mismatch = function(unit){
	// this.expected.push(this.index,unit);
	if(this.alternative.length===0){
		for(var i=0; i<this.localdata.length; ++i)
			this.redirect.push(null);
	} else {
		var that = this.alternative[this.alternative.length-1];
		for(var i=0; i<this.localdata.length; ++i)
			if(!util.equals(this.localdata[i],that.localdata[i])) break;
		for(var j=i+1; j<this.localdata.length; ++j) this.redirect.push(null);
		this.redirect = this.redirect.concat(that.localdata.slice(i));
		this.log(2,"<mismatch>",this.redirect,this.localdata,that.localdata);
		if(this.redirect.length===0) this.load(); // delayed so that it can be ignored midway
	}
	return null;
};

State.prototype.local = function(initial){
	if(this.redirect.length===0) return initial;
	else {
		this.log(2,1,"<redirect>",this.redirect);
		if(this.redirect.length===1) this.load();
		return this.redirect.shift();;
	}
};

State.prototype.log = function(level){
	if(util.debug<level) return;
	var args = Array.prototype.slice.call(arguments,1)
			.map(function(x){ return JSON.stringify(x) }),
		offset = ( !isNaN(parseInt(args[0])) ? parseInt(args.shift()) : 0 ),
		tab = new Array(this.localdata.length+offset).join("\t");
	console.log(tab+args.join(" "));
};

module.exports = State;