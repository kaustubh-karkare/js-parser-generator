
var pattern = require("./pattern");

var build_and = function(tlist, toplevel, labels){

	var series = [], choice = [], next;
	var item, loop, greedy, alt;
	var prefix = [], suffix = [];

	if(!toplevel){
		if( (next=tlist.peek()) && next.match("operator","(") ) tlist.next();
		else throw new Error("Expected '('" +" "+JSON.stringify(next) );
	}

	while(true){

		next = tlist.peek(1);

		// loop termination via EOF or start of next production
		if(!next || next.type==="identifier" && (
			tlist.peek(3) && tlist.peek(2).type==="string" && tlist.peek(3).match("operator","=") ||
			tlist.peek(2) && tlist.peek(2).match("operator","=")
		)){
			if(!toplevel) throw new Error("Unexpected End of Grammar");
			choice.push(series); 
			break;
		}

		if(next.type==="operator"){
			
			alt = (next.data==="/" || next.data==="|");
			// loop termination or next alternative
			if(alt || toplevel && next.data===";" || !toplevel && next.data===")"){
				if(prefix.length) throw new Error("Unexpected End of Expression");
				tlist.next();
				choice.push(series);
				if(alt){ series = []; continue; }
				break;

			// lookahead
			} else if(next.data==="&" || next.data==="!"){
				prefix.push(tlist.next());
				continue;
			
			} else if(next.data==="("){
				// will be dealt with later

			} else if(next.data==="?" || next.data==="*" || next.data==="+"){
				throw new Error("Unexpected Operator");

			} else throw new Error("Unknown Operator"+next.data);

		}

		// labels
		if(next.type==="identifier" && tlist.peek(2) && tlist.peek(2).match("operator",":")){
			if(next.data==="this" || next.data==="args" || next.data==="")
				throw new Error("Reserved Identifier: Cannot use as label.");
			if(labels.indexOf(next.data)===-1) labels.push(next.data);
			prefix.push(next);
			tlist.next(); tlist.next();
			continue;
		}

		// action
		if(next.type==="code" && prefix.length===0){
			series = ( series.length===0 ? new pattern.empty() :
				series.length===1 ? series[0] : new pattern.and(series) );
			series = [new pattern.action( series, tlist.next().data )];
			continue;
		}

		// patterns (not modifiers): string, range, reference, and, predicate
		if( next.type==="string" || next.type==="range" )
			item = new pattern[next.type](tlist.next().data);
		else if( next.type==="identifier" )
			item = new pattern.reference(tlist.next().data);
		else if( next.match("operator","(") )
			item = arguments.callee(tlist,false,labels);
		else if( next.type==="code" && (temp=prefix[prefix.length-1]) &&
			temp.type==="operator" && (temp.data==="&" || temp.data==="!") )
			item = new pattern.predicate( prefix.pop().data==="&", tlist.next().data );
		else throw new Error("Unexpected Token"+(" "+JSON.stringify(next)));

		// first consume loop suffixes
		next = tlist.peek();
		if(next && next.type==="operator" && (next.data==="?" || next.data==="*" || next.data==="+") ){
			loop = tlist.next().data;
			greedy = !( (next = tlist.peek()) && next.match("operator","?") && tlist.next() );
			if(loop==="?") item = new pattern.loop( item, 0, 1, greedy );
			else if(loop==="*") item = new pattern.loop( item, 0, Infinity, greedy );
			else if(loop==="+") item = new pattern.loop( item, 1, Infinity, greedy );
		} else loop = null;

		// prefix operators are applied at last
		while(prefix.length){
			next = prefix.pop();
			if(next.type==="identifier") item = new pattern.label( next.data, item );
			else item = new pattern.lookahead( next.data==="&", item );
		}

		series.push(item);
	}

	for(var i=0; i<choice.length; ++i)
		if(choice[i].length===0) choice[i] = new pattern.empty();
		else if(choice[i].length===1) choice[i] = choice[i][0];
		else choice[i] = new pattern.and(choice[i]);

	if(choice.length===1) return choice[0];
	else return new pattern.or(choice);
};

var build_production = function(tlist){
	var next, name, altname = null, item, labels = [];

	if( (next=tlist.next())===null || next.type!=="identifier")
		throw new Error("Expected Production Name");
	else name = next.data;

	if( (next=tlist.peek()) && next.type==="string")
		altname = tlist.next().data;

	if( (next=tlist.next())===null || !next.match("operator","="))
		throw new Error("Expected '='");

	item = build_and(tlist, true, labels);

	return new pattern.production(name,altname,item,labels);
};

module.exports = {
	"production" : build_production,
	"and" : build_and,
};
