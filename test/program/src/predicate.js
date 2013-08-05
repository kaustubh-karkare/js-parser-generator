
// Functions to simplify & speed up the parser's matching process.
module.exports = function(lib,src,data){
	return { // that = predicate's this object

		"declaration" : function(that){
			var name, type = "variable";
			if(that.data.substr(that.index,type.length)===type) name = type;
			else for(type in src.datatype)
				if(that.data.substr(that.index,type.length)===type)
					{ name = type; break; }
			if(!name) return false;
			that.index += name.length;
			that.result = name;
			return this.whitespace(that,1);
		},

		"literal" : function(that){ // used to read string & regexp literals
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

		"whitespace" : function(that,atleast){ // used to read whitespace
			var i, c, s = that.index, ws = /^[ \t\n\r\v]|\/\/|\/\*/;
			while( (c=that.data.substr(that.index,2)) && ws.test(c) ){
				if(c==="//" || c==="/*")
					if((i=that.data.indexOf(c==="/*"?"*/":"\n",that.index+2))!==-1) that.index = (i+(c==="/*"?2:1));
					else that.index = that.data.length; // EOF valid terminator for comments
				else ++that.index;
			}
			return (that.index-s) >= (atleast || 0);
		}

	};
};