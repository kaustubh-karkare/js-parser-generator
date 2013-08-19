
var Array = function(data){
	if(!this) return;
	if(arguments.length===0){
		this.raw = [];
	} else if(arguments.length===1){
		if(typeof(data)==="array"){
			this.raw = data;
		} else if(typeof(data)==="integer"){
			this.raw = [];
			this.raw.length = data;
		} else {
			this.raw = [data];
		}
	} else {
		this.raw = [];
		this.raw.length = arguments.length;
		for(var i=0; i<arguments.length; i+=1)
			this.raw[i] = arguments[i];
	}
};

Array.prototype = {
	find : function(item){
		for(var i,j in this.raw)
			if(j===item) return i;
		return -1;
	},
	join : function(delim){
		var result = "";
		for(var i,j in this.raw)
			result += (i?delim:"")+j;
		return result;
	},
	map : function(fn){
		var result = [];
		result.length = this.raw.length;
		for(var i,j,k in this.raw)
			result[i] = fn(j,i,k);
		return new Array(result);
	},
	pop : function(){
		if(this.raw.length===0) return this.raw[0];
		var last = this.raw[this.raw.length-1];
		this.raw.length -= 1;
		return last;
	},
	push : function(){
		var l = this.raw.length;
		this.raw.length += arguments.length;
		for(var i=0; i<arguments.length; i+=1)
			this.raw[l+i] = arguments[i];
		return this.raw.length;
	},
	reverse : function(){
		var l = this.raw.length-1;
		for(var i,j,k in this.raw){
			if(i>=l-i) break;
			k[i] = k[l-i];
			k[l-i] = j;
		}
		return this;
	},
	sort : function(){
		var l = this.raw.length-1;
		for(var x=0; x<l; x+=1)
			for(var i,j,k in this.raw)
				if(i<l && k[i]>k[i+1])
					k[i] = k[i+1],
					k[i+1] = j;
		return this;
	},
	toString : function(){
		return "["+this.map(function(i){
			try { return i.toString(); }
			catch(e){ return i; }
		}).join(",")+"]";
	}
};

var a = new Array(4,2,1,5,3);
a.push(new Array(1,4),new Array(1,3));
a.sort().reverse().pop();
a.toString();
