
var pg = require("../src/");

var tests = [
	// and, label, action
	"a = s:'a' s:'B'i s:'c' { return s.join(''); }", "abc", "abc",
	// loop, greedy, mismatch
	"a = x:'a'* y:('a' 'a' 'a') { return x.join(''); }", "aaaaa", "aa",
	// loop, non-greedy, mismatch
	"a = x:'a'*? y:('a' 'b' 'c') { return x.join(''); }", "aaabc", "aa",
	// predicates
	"a = x:. &{ return x==='a'; } y:. !{ return y==='c'; } { return x+y; }", "ab", "ab", // !{ return x==='A'; }
	// lookaheads
	"a = ![^c] x:. &x:'d' . { return x.join(''); }", "cd", "cd",
	"a = &x:'a'* .* 'ab' { return x.join(''); }; ", "aaab", "aaa",
	// error: empty starting production
	"a = b = 'a' { return 42; }", "a", null,
];

for(var i=2; i<tests.length; i+=3){
	var g = tests[i-2], d = tests[i-1], v = tests[i], t = new Date().getTime(), r;
	console.log("\n\tGrammer : "+g+"\n\tData    : "+d);
	try {
		r = new pg(g).parse(d).execute();
		if(JSON.stringify(r)!==JSON.stringify(v))
			throw new Error("Incorrect Evaluation Result : "+JSON.stringify(r));
	} catch(e){
		if(tests[i]!==null){ console.log("\nTest Failed.\n"+e.stack); break; }
	}
	t = new Date().getTime() - t;
	console.log("\tValue   : "+v+"\n\tTime    : "+t+" ms\n");
}

if(i>=tests.length) console.log("All tests completed successfully.\n")