
{
	var async = args[0], input = args[1];

	var a = function(x){ return Array.isArray(x) ? x : (x?[x]:[]); };

	var evaluate = function(left,op,right,callback){
		var fns = a(left).concat(a(right));
		async.series(fns,function(e,result){
			if(e){ callback(e); return; }
			var value = result.shift(), operator = a(op), next;
			while(op=operator.shift()){
				next = result.shift();
				if(op==="+") value += next;
				else if(op==="-") value -= next;
				else if(op==="*") value *= next;
				else if(op==="/") value /= next;
				else if(op==="%") value %= next;
			}
			callback(null,value);
		});
	};
}

expression = exp_add;

_ = [ \t\n]* ;

exp_add = left:exp_mul (op:("+"/"-") _ right:exp_mul)*
	{ evaluate(left,op,right,callback); }

exp_mul = left:primary (op:("*"/"/"/"%") _ right:primary)*
	{ evaluate(left,op,right,callback); }

primary = "(" _ exp:expression ")" _ { exp(callback); }
	| d:[0-9]+ _ { callback(null,parseInt(a(d).join(''))); }
	| "input" _
		{
			// input("Enter a Number: ",function(data){ callback(null,parseInt(data)); });
			setTimeout(function(){ callback(null,42); },1000);
		}