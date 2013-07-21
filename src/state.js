
var util = require("./util");

var State = function(parser,data){
	this.parser = parser;
	this.data = data;
	this.index = 0;
	this.debug = 0;

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
	if(!data) return this.localdata[this.localdata.length-1];
	else return this.localdata[this.localdata.length-1] = data;
};

State.prototype.save = function(){
	var that = {
		"localdata" : util.clone(this.localdata), // not loaded, as this is set during redirection itself
		"index" : this.index,
		"namedata" : util.clone(this.namedata)
	};
	this.alternative.push(that);
	this.log(2,"<alternative>",that.localdata.slice(-1)[0]);
	return that.localdata.slice(-1)[0];
};

State.prototype.load = function(){
	var that = this.alternative.pop();
	this.index = that.index;
	this.namedata = that.namedata;
	this.log(2,"<restored>",that.localdata.slice(-1)[0]);
};

State.prototype.sync = function(that){
	for(var key in that)
		this[key] = that[key];
};

State.prototype.mismatch = function(){
	if(this.redirect.length)
		throw new Error("wtf");
	if(this.alternative.length===0){
		for(var i=0; i<this.localdata.length; ++i)
			this.redirect.push(null);
	} else {
		var that = this.alternative[this.alternative.length-1];
		for(var i=0; i<this.localdata.length; ++i)
			if(!util.equals(this.localdata[i],that.localdata[i])) break;
		for(var j=i+1; j<this.localdata.length; ++j) this.redirect.push(null);
		this.redirect = this.redirect.concat(that.localdata.slice(i));
		this.log(2,"<mismatch>",this.redirect);
		if(this.redirect.length===0) this.load(); // delayed so that it can be ignored midway
	}
};

State.prototype.local = function(initial){
	if(this.redirect.length===0) return initial;
	else {
		this.log(2,"<redirect>",this.redirect);
		if(this.redirect.length===1) this.load();
		return this.redirect.shift();;
	}
};

State.prototype.log = function(level){
	var args = Array.prototype.slice.call(arguments,1)
			.map(function(x){ return JSON.stringify(x) }),
		offset = ( !isNaN(parseInt(args[0])) ? parseInt(args.shift()) : 0 ),
		tab = new Array(this.localdata.length+offset).join("\t");
	if(this.debug>=level) console.log(tab+args.join(" "));
};

module.exports = State;