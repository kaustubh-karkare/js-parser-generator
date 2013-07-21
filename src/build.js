
var pattern = require("./pattern");

var build_and = function(tlist, toplevel, labels){
	labels = labels || [];

	var series = [], choice = [], next;
	var lookahead, label, item, loop, action;

	// [=!]?({code}|label:(string|regexp|identifiers|expression)([?.+][?]?)?{code}) [|);]

	if(!toplevel){
		if( (next=tlist.peek()) && next.match("operator","(") ) tlist.next();
		else throw new Error("Expected '('" +" "+JSON.stringify(next) );
	}

	while(tlist.peek()){

		lookahead = 0;
		if( (next=tlist.peek()) && next.type==="operator" ){
			if(next.data==="&") lookahead = 1;
			else if(next.data==="!") lookahead = -1;
			if(lookahead) tlist.next();
		}

		if(lookahead && (next=tlist.peek()) && next.type==="code"){
			series.push( new pattern.predicate(tlist.next().data) );
			continue;
		}

		if( tlist.peek(2) && tlist.peek().type==="identifier" && tlist.peek(2).match("operator",":") ){
			labels.push( label = tlist.next().data );
			tlist.next();
		} else label = null;

		if( (next=tlist.peek()) ){
			if( next.type==="string" || next.type==="regexp" )
				item = new pattern[next.type](tlist.next().data);
			else if( next.type==="identifier" )
				item = new pattern.reference(tlist.next().data);
			else if( next.type==="operator" )
				item = arguments.callee(tlist,false,labels);
			else throw new Error("Unexpected Token" +" "+JSON.stringify(next) );
		}

		loop = 0;
		if( (next=tlist.peek()) && next.type==="operator" ){
			if(next.data==="?") loop = 1;
			else if(next.data==="*") loop = 2;
			else if(next.data==="+") loop = 3;
			if(loop) tlist.next();
		}
		if( loop && (next=tlist.peek()) && next.match("operator","?") ){
			loop += 10;
			tlist.next();
		}

		if(loop) item = new pattern.loop(item, loop%10===3?1:0, loop%10===1?1:9999, loop>10?false:true );
		if(label) item = new pattern.label(label, item);
		if(lookahead) item = new pattern.lookahead( lookahead===1?true:false, item );
		series.push(item);

		if( (next=tlist.peek()) && next.type==="code" ){
			series = ( series.length===0 ? new pattern.empty() :
				series.length===1 ? series[0] : new pattern.and(series) );
			series = [new pattern.action( series, tlist.next().data, labels )];
			labels = [];
		}

		if( (next=tlist.peek()) && next.type==="operator" &&
			(next.data==="|" || !toplevel && next.data===")" || toplevel && next.data===";") ) {
			choice.push(series);
			if(next.data==="|"){ tlist.next(); series = []; }
			else if(next.data===")"){ tlist.next(); break; }
			else break; // dont consume the semicolon
		} else if(series[series.length-1] instanceof pattern.action)
			throw new Error("Expected '|' or '"+(toplevel?";":")")+"'");

	} // while

	for(var i=0; i<choice.length; ++i)
		if(choice[i].length===0) choice[i] = new pattern.empty();
		else if(choice[i].length===1) choice[i] = choice[i][0];
		else choice[i] = new pattern.and(choice[i]);

	if(choice.length===1) return choice[0];
	else return new pattern.or(choice);
};

var build_production = function(tlist){
	var next, name, item;

	if( (next=tlist.next())===null || next.type!=="identifier")
		throw new Error("Expected Production Name");
	else name = next.data;

	if( (next=tlist.next())===null || !next.match("operator","="))
		throw new Error("Expected '='");

	item = build_and(tlist, true);

	if( (next=tlist.next())===null || !next.match("operator",";") )
		throw new Error("Expected ';'");

	return new pattern.production(name,item);
};

module.exports = {
	"production" : build_production,
	"and" : build_and,
};
