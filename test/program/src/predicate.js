
// Functions to simplify & speed up the parser's matching process.
var predicate = {

	"ignoretill" : function(that,delim,required){
		for(var c; (c=that.data.substr(that.index,delim.length)) && c!==delim; ++that.index);
		if(c===delim || !required){ if(c===delim) that.index+=c.length; return true; } else return false;
	},

	"literal" : function(that){ // used to read string & regexp literals
		// that = predicate's this object
		var c = that.data[that.index], d = c, e = {"t":"\t","n":"\n","r":"\r","v":"\v"};
		if(c===undefined) return false;
		for(that.result = ""; (c=that.data[++that.index]) && c!==d; ){
			if(c!=="\\") that.result += c;
			else {
				c = that.data[++that.index];
				if(c in e) that.result += e[c];
				else if(c==="u" || c==="x"){
					var len = (c==="x"?4:2), val = that.data.substr(that.index,l);
					if(val.length!==len || val.match(/[^0-9A-F]/i)) return false;
					that.result += String.fromCharCode( parseInt(val,16) );
				} else that.result += c;
			} // else
		} // for
		if(c!==d) return false; else ++that.index; // skip the delimiter
		return true;
	},

};

module.exports = function(){ return predicate; };