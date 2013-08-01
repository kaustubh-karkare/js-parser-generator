
var pg = require("../src/");

var test = [
	{ // and, label, action
		"grammar": "a = s:'a' s:'B'i s:('c'/'C') { return s.join(''); }",
		"input": "abc",
		"result": "abc"
	},
	{ // choice, loop, greedy, backtracking
		"grammar": "a = x:('a'/'A')* y:('a' 'a' 'a') { return x.join(''); }",
		"input": "aAaaa",
		"result": "aA"
	},
	{ // loop, non-greedy, backtracking
		"grammar": "a = x:'a'*? y:('a' 'b' 'c') { return x.join(''); }",
		"input": "aaabc",
		"result": "aa"
	},
	{ // predicates
		"grammar": "a = x:. &{ return x==='a'; } y:. !{ return y==='c'; } { return x+y; }",
		"input": "ab",
		"result": "ab"
	},
	{ // lookaheads
		"grammar": "a = ![^c] x:. &x:'d' . { return x.join(''); }",
		"input": "cd",
		"result": "cd"
	},
	{ // lookaheads
		"grammar": "a = &x:'a'* .* 'ab' { return x.join(''); }; ",
		"input": "aaab",
		"result": "aaa"
	},
	{ // error: empty starting production
		"grammar": "a = b = 'a' { return 42; }",
		"input": "a",
		"result": null
	}
];

var print = process.stdout.write.bind(process.stdout);

for(var i=0; i<test.length; ++i){

	var time = new Date().getTime(); // start time
	print(
		"\n\tGrammer : " + test[i].grammar +
		"\n\tInput   : " + test[i].input );
	try {
		var parser = pg.buildParser(test[i].grammar,{debug:0});
		var result = parser.parse(test[i].input)();
		if( JSON.stringify(test[i].result)!==JSON.stringify(result) )
			throw new Error("Incorrect Evaluation Result : " + JSON.stringify(result) );
	} catch(e){
		if(test[i].result!==null){
			print("\n\nTest Failed.\n" + e.stack + "\n\n");
			console.log(JSON.stringify(parser.production ,null,4));
			break;
		}
	}
	time = new Date().getTime() - time; // time difference
	print(
		"\n\tValue   : " + test[i].result +
		"\n\tTime    : " + time + " ms" +
		"\n" );
}

if(i>=test.length)
	print("\nAll tests completed successfully.\n\n");