
var Array = function(data){
	if(arguments.length===0){
		this.data = [];
	} else if(arguments.length===1){
		if(typeof(data)==="array") this.data = data;
		else if(typeof(data)==="integer"){ this.data = []; this.data.length = data; }
		else this.data = [data];
	} else {
		this.data = [];
		this.data.length = arguments.length;
		for(var i=0; i<arguments.length; i+=1)
			this.data[i] = arguments[i];
	}
};

Array.prototype = {
	join : function(delim){
		var result = "";
		for(var i,j in this.data)
			result += (i?delim:"")+j;
		return result;
	},
	map : function(fn){
		var result = [];
		result.length = this.data.length;
		for(var i,j,k in this.data)
			result[i] = fn(j,i,k);
		return new Array(result);
	},
};

var a = new Array([1,2,3,4,5]);
"["+a.map(function(x){ return x*x; }).join(",")+"]";