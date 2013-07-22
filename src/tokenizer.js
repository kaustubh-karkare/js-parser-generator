
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



var hexchar = "0123456789ABCDEF";

var hex_char = function(str,len){
	if(str.length!==len) throw new Error("Unexpected End of String");
	for(var i=0; i<len; ++i)
		if(hex_charchar.indexOf(str[i].toUpperCase())===-1)
			throw new Error("Unexpected Symbol in String");
	return String.fromCharCode(parseInt(str,16));
};

var read_str = function(str,i,delimiter){
	var current = "";
	do {
		if(str[i]===undefined) throw new Error("Unexpected End of String");
		else if(str[i]!=="\\") current += str[i];
		else if(str[++i] in escapable) current += escapable[str[i]];
		else if(str[i]==="x") { current += hex_char(str.substr(++i,2),2); i+=2; }
		else if(str[i]==="u") { current += hex_char(str.substr(++i,4),4); i+=4; }
		else current += str[i];
	} while(str[++i]!==delimiter);
	return [current,i];
};



/*
In a block of JavaScript code, in order to determine whether a "/" marks the start
of a regular expression, or is a division operator, we need some context information.
The division operator will appear only after a ")" (marking the end of a parenthesized
expression), an alphanumeric character or a numeric value, which would be the dividend
itself. Hence, by tracking the last non-whitespace character (ignoring comments), we
can make our decision.
*/
var predivchar = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_).";

// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions (special character = \s)
var whitespace = " \f\n\r\t\v​\u00a0\u1680​\u180e\u2000​\u2001\u2002​\u2003\u2004​\u2005\u2006​\u2007\u2008​\u2009\u200a​\u2028\u2029​\u202f\u205f​\u3000";

var read_code = function(str,i){
	var current = str[i];
	var nesting = 1, delimiter;
	var lastchar = null;
	while(nesting>0 && str[++i]){

		// single line comments
		if(str.substr(i,2)==="//"){
			i+=2;
			while(str[++i] && str[i]!=="\n") current+=str[i];
			current+=str[++i];

		// multi line comments
		} else if(str.substr(i,2)==="/*"){
			i+=2;
			while(str[++i] && str.substr(i,2)!=="*/");
			current+="*/"; i+=2;

		// string & regexp
		} else if(str[i]==="\"" ||
			str[i]==="/" && predivchar.indexOf(lastchar.toUpperCase())===-1 ){
			current += delimiter = str[i];
			while(str[++i])
				if(str[i]===delimiter) break;
				else if(str[i]==="\\") current += str[++i];
				else current += str[i];
			current += str[i];
			lastchar = delimiter;

		// code block
		} else if(str[i]==="{"){
			nesting++;
			current += str[i];
			lastchar = "{";
		} else if(str[i]==="}"){
			nesting--;
			current += str[i];
			lastchar = "}";

		// everything else
		} else {
			current += str[i];
			if(whitespace.indexOf(str[i])===-1) lastchar = str[i];
		}

	}
	if(nesting) throw new Error("Unexpected End of Code");
	else ++i; // advance past the last }
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
			result.push(
				new Token("range",[current[0],(str[i]==="i"?str[i++]:"")+(negative?"n":"")])
			);

		} else if(str[i]==="."){
			++i;
			result.push(new Token("range",["","n"]));

		// code blocks
		} else if(str[i]==="{"){
			current = read_code(str,i);
			result.push( new Token("code",current[0]) );
			i = current[1];

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