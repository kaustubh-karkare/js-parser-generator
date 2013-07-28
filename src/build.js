
var pattern = require("./pattern");

var build_and = function(tlist, toplevel, labels){
	labels = labels || [];

	var series = [], choice = [], next;
	var lookahead, label, item, loop, greedy, action;

	// [(] [=!]?({code}/label:(string/range/identifiers/expression)([?.+][?]?)?{code}) [)/;]

	if(!toplevel){
		if( (next=tlist.peek()) && next.match("operator","(") ) tlist.next();
		else throw new Error("Expected '('" +" "+JSON.stringify(next) );
	}

	while(tlist.peek()){

		// Loop Termination
		if( (next=tlist.peek()) && next.type==="operator" &&
			(next.data==="/" || !toplevel && next.data===")" || toplevel && next.data===";") ) {
			choice.push(series);
			tlist.next();
			if(next.data==="/") series = [];
			else break; // if ) or ;
		}

		// If the next few tokens are the start of the next production, break loop
		if( tlist.peek().type==="identifier" && (
			tlist.peek(2) && tlist.peek(2).match("operator","=") ||
			tlist.peek(3) && tlist.peek(2).type==="string" && tlist.peek(3).match("operator","=")) ){
			choice.push(series);
			break;
		}

		// Action
		if( (next=tlist.peek()) && next.type==="code" ){
			series = ( series.length===0 ? new pattern.empty() :
				series.length===1 ? series[0] : new pattern.and(series) );
			series = [new pattern.action( series, tlist.next().data, labels )];
			labels = [];
			continue;
		}

		lookahead = 0;
		if( (next=tlist.peek()) && next.type==="operator" ){
			if(next.data==="&") lookahead = 1;
			else if(next.data==="!") lookahead = -1;
			if(lookahead) tlist.next();
		}

		// Predicate
		if(lookahead && (next=tlist.peek()) && next.type==="code"){
			// series.push( new pattern.predicate(tlist.next().data) );
			item = series.length===0 ? new pattern.empty() :
				series.length===1 ? series[0] : new pattern.and(series);
			series = [ new pattern.predicate(lookahead===1,item,tlist.next().data,labels) ];
			continue;
		}

		// Label
		if( tlist.peek(2) && tlist.peek().type==="identifier" && tlist.peek(2).match("operator",":") ){
			labels.push( label = tlist.next().data );
			if(label==="this" || label==="args")
				throw new Error("Reserved : Cannot use \""+label+"\" as a label.");
			tlist.next();
		} else label = null;

		// Pattern
		if( (next=tlist.peek()) ){
			if( next.type==="string" || next.type==="range" )
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
		greedy = 1;
		if( loop && (next=tlist.peek()) && next.match("operator","?") ){
			greedy = 0;
			tlist.next();
		}

		if(loop===1) item = new pattern.or( greedy ? [item,new pattern.empty()] : [new pattern.empty(),item] );
		else if(loop===2) item = new pattern.loop(item,9999,greedy);
		else if(loop===3) item = new pattern.and([ item, new pattern.loop(item,9999,greedy) ]);

		// Wrap & Insert
		if(label) item = new pattern.label(label, item);
		if(lookahead) item = new pattern.lookahead( lookahead===1?true:false, item );
		series.push(item);

	} // while

	for(var i=0; i<choice.length; ++i)
		if(choice[i].length===0) choice[i] = new pattern.empty();
		else if(choice[i].length===1) choice[i] = choice[i][0];
		else choice[i] = new pattern.and(choice[i]);

	if(choice.length===1) return choice[0];
	else return new pattern.or(choice);
};

var build_production = function(tlist){
	var next, name, altname = null, item;

	if( (next=tlist.next())===null || next.type!=="identifier")
		throw new Error("Expected Production Name");
	else name = next.data;

	if( tlist.peek() && next.type==="string")
		altname = tlist.next().data;

	if( (next=tlist.next())===null || !next.match("operator","="))
		throw new Error("Expected '='");

	item = build_and(tlist, true);

	return new pattern.production(name,altname,item);
};

module.exports = {
	"production" : build_production,
	"and" : build_and,
};
