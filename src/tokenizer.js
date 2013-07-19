
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



var tokenize = function(str){
	var i = 0, result = [], current;
	while(i<str.length){
		while (str[i]===" " || str[i]==="\t" || str[i]==="\n") ++i; // skip whitespace
		if(str[i]==="\""){
			current = "";
			while(str[++i]!=="\"")
				current += (str[i]==="\\" ? ( i++ , escapable[str[i]] || str[i] ) : str[i]);
			result.push( new Token("string",current) );
			++i;
		} else if(str[i]==="/"){
			current = "";
			while(str[++i]!=="/")
				current += (str[i]==="\\" && str[i+1]==="/" ? str[++i] : str[i]);
			result.push( new Token("regexp",current) );
			++i;
		} else if(str[i].match(/[A-Za-z_]/)){
			current = "";
			while(str[i].match(/[A-Za-z0-9_]/)) current += str[i++];
			result.push( new Token("identifier",current) );
		} else if(["=","(",")","|","?","*","+",":",";"].indexOf(str[i])!==-1){
			result.push( new Token("operator",str[i++]) );
		} else throw new Error("Unknown symbol : "+i+" "+str[i]);
	}
	return new TokenList(result);
};



module.exports = tokenize;