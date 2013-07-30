
var util = require("./util");

var State = function(parser,data){
	this.parser = parser;
	this.data = data;
	this.index = 0;

	this.localdata = [];
	this.labelled = [];
	this.alternative = [];
	this.redirect = [];
};

module.exports = State;

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
		"labelled" : util.clone(this.labelled),
	};
	this.alternative.push(that);
	this.log(2,"<alternative>",that.localdata.slice(-1)[0]);
	return that;
};

State.prototype.load = function(){
	var that = this.alternative.pop();
	if(that){
		// localdata not loaded, as this is set during redirection itself
		this.index = that.index;
		this.labelled = that.labelled;
		this.log(2,1,"<restored>",that.localdata.slice(-1)[0],this.expected);
	}
};

State.prototype.clone = function(){
	var that = {};
	for(var key in this)
		if(Array.isArray(this[key])) that[key] = util.clone(this[key]);
		else that[key] = this[key];
	that.__proto__ = this.__proto__; // make this object an instance of the State class
	return that;
};

State.prototype.match = function(unit){
	this.index += unit.length;
	return unit;
};

State.prototype.mismatch = function(unit){
	if(this.alternative.length===0){
		for(var i=0; i<this.localdata.length; ++i)
			this.redirect.push(null);
	} else {
		var that = this.alternative[this.alternative.length-1];
		for(var i=0; i<this.localdata.length; ++i)
			if(!util.equals(this.localdata[i],that.localdata[i])) break;
		for(var j=i; j<this.localdata.length; ++j) this.redirect.push(null);
		this.redirect = this.redirect.concat(that.localdata.slice(i));
		this.log(2,"<mismatch>",this.redirect,i,this.localdata,that.localdata);
		if(this.redirect.length===0) this.load(); // delayed so that it can be ignored midway
	}
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
	if(this.parser.config.debug && level<=2){
		var args = Array.prototype.slice.call(arguments,1)
				.map(function(x){ return JSON.stringify(x) }),
			offset = ( !isNaN(parseInt(args[0])) ? parseInt(args.shift()) : 0 ),
			tab = new Array(this.labelled.length+this.localdata.length+offset).join("\t");
		console.log(tab+args.join(" "));
	}
};