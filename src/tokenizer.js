
// The following classes are used during the lexical analysis of the language grammer.

var escapable = { "f":"\f", "n":"\n", "r":"\n", "t":"\t", "v":"\v", "\"":"\"" };

var Token = function(type,data){
	this.type = type;
	this.data = data;
};

Token.prototype.match = function(type,data){
	return this.type === type && this.data === data;
};



var TokenList = function(tokens){
	this.index = 0;
	this.tokens = tokens;
};

TokenList.prototype.peek = function(d){
	return this.tokens[this.index+(d||1)-1];
};

TokenList.prototype.next = function(){
	return this.tokens[this.index++];
};





var hex = function(str,len){
	if(str.length!==len) throw new Error("Unexpected End of String");
	if(str.match(/[^0-9A-F]/i)) throw new Error("Unexpected Symbol in String");
	return String.fromCharCode(parseInt(str,16));
};

var read_str = function(str,i,delimiter){
	var current = "";
	do {
		if(str[i]===undefined) throw new Error("Unexpected End of String");
		else if(str[i]!=="\\") current += str[i];
		else if(str[++i] in escapable) current += escapable[str[i]];
		else if(str[i]==="x") { current += hex(str.substr(++i,2),2); i+=2; }
		else if(str[i]==="u") { current += hex(str.substr(++i,4),4); i+=4; }
		else current += str[i];
	} while(str[++i]!==delimiter);
	return [current,i];
};

var operators = ["=","(",")","/","?","*","+",":",";","&","!"];

var tokenize = function(str){
	var i = 0, result = [], current;
	while(i<str.length){

		// whitespace
		if(str[i]===" " || str[i]==="\t" || str[i]==="\n"){
			++i;

		// single line comments
		} else if(str.substr(i,2)==="//"){
			i+=2;
			while(str[++i] && str[i]!=="\n");
			++i;

		// multiline comments
		} else if(str.substr(i,2)==="/*"){
			i+=2;
			while(str[++i] && str.substr(i,2)!=="*/");
			i+=2;

		// strings
		} else if(str[i]==="\""){
			current = read_str(str,++i,"\"");
			result.push( new Token("string",current[0]) );
			i = current[1]+1;

		// character range
		} else if(str[i]==="["){
			if(str[i+1]==="^"){ negative = true; ++i; }
			else negative = false;
			current = read_str(str,++i,"]");
			i = current[1]+1;
			current = current[0]+":"+(str[i]==="i"?str[i++]:"")+(negative?"n":"");
			result.push( new Token("range",current) );
			

		// code blocks
		} else if(str[i]==="{"){
			current = str[i];
			var nesting = 1, delimiter;
			while(nesting>0 && str[++i]){
				if(str.substr(i,2)==="//"){
					i+=2;
					while(str[++i] && str[i]!=="\n");
				} else if(str.substr(i,2)==="/*"){
					i+=2;
					while(str[++i] && str.substr(i,2)!=="*/");
				} else if(str[i]==="\""){ // || str[i]==="/"
					current += delimiter = str[i];
					while(str[++i])
						if(str[i]===delimiter) break;
						else if(str[i]==="\\") current += str[++i];
						else current += str[i];
					current += str[i];
				} else if(str[i]==="{"){
					nesting++;
					current += str[i];
				} else if(str[i]==="}"){
					nesting--;
					current += str[i];
				} else current += str[i];
			}
			if(nesting) throw new Error("Unexpected End of Code"+"'"+str[i]+"':"+i+"\n#"+JSON.stringify(result.slice(-3)));
			else ++i; // advance past the last }
			result.push( new Token("code",current) );

		// identifiers
		} else if(str[i].match(/[A-Za-z_]/)){
			current = "";
			while(str[i].match(/[A-Za-z0-9_]/)) current += str[i++];
			result.push( new Token("identifier",current) );

		// operators
		} else if(operators.indexOf(str[i])!==-1){
			result.push( new Token("operator",str[i++]) );

		// unknown
		} else {
			throw new Error("Unknown symbol : "+str[i]+" (index:"+i+")");
		}

	}
	return new TokenList(result);
};



module.exports = tokenize;