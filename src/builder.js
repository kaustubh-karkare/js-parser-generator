
var pattern = require("./pattern");

// The following recursive function processes the sequence of tokens to build a tree structure.

var build = function(tlist){
	var name = null, series = [], choice = [], next;
	if(tlist.peek() && tlist.peek().match("operator","(")) tlist.next(); // skip (
	if(tlist.peek(2) && tlist.peek().type==="identifier" && tlist.peek(2).match("operator",":")){
		name = tlist.next().data;
		tlist.next();
	}
	outer: while( next = tlist.peek() ){
		switch(next.type){
			case "string":
			case "regexp":
				series.push( new pattern[next.type](tlist.next().data) );
				break;
			case "identifier":
				series.push( new pattern.production(tlist.next().data) );
				break;
			case "operator":
				switch(next.data){
					case "(":
						series.push(build(tlist));
						break;
					case ")":
					case ";":
						tlist.next(); // skip ) or ;
						break outer;
					case "|":
						choice.push(series);
						series = [];
						tlist.next(); // skip |
						break;
					case "?":
					case "*":
					case "+":
						if(series.length===0 || series[series.length-1] instanceof pattern.loop)
							throw new Error("Nothing to Repeat"+JSON.stringify(series,null,4) );
						series.push( new pattern.loop(
							series.pop(),
							next.data==="+" ? 1 : 0,
							next.data==="?" ? 1 : 9999
						));
						tlist.next();
				}
				break;
			default: throw new Error("Unsupported Token");
		}
	}
	choice.push(series);

	if(choice.length===1)
		return new pattern.and(name,choice[0]);

	for(var i=0; i<choice.length; ++i)
		if(choice[i].length===1) choice[i] = choice[i][0];
		else choice[i] = new pattern.and(null,choice[i]);
	choice = new pattern.or(choice);
	if(name===null) return choice;
	else return new pattern.and(name,[choice]);
};


module.exports = build;