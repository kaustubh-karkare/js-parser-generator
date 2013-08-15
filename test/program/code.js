
JSON = {
	stringify : function(data){
		if(typeof(data)==="array"){
			var result = "[";
			for(var i=0; i<data.length; i+=1)
				result += (i===0?"":",") + data[i];
			return result + "]";
		} else if(typeof(data)==="integer" || typeof(data)==="string"){
			return data+"";
		}
	}
};

square = [0,1,4,7,16,25,36,49,64,81,100,121];

square[3] = 9;
square.length;
JSON.stringify(square);
square.length = 11;
JSON.stringify(square);

obj = {
	"int":1,
	"str":"two",
	"arr":[3,4],
	"no":{"a":"b","c":"d"},
	"fn":function(x){ return x*x; }
};

for(i=error=0; i<=10; i+=1)
	if(square[i]!==obj.fn(i))
		error += 1;
"Errors = "+error;

1 + 25 * 20 + 4 / 2 - 13%10 ; // arithmetic operations
!true - (-1) + "2"; // implicit type casting
1<2 ? -1>-2 ? 42 : -666 : -666 ; // ternary operator
if(1==true && -Infinity < +Infinity) 0/0; else 666; // if statement

closure = function(){
	var count = 1;
	return function(){
		return count+=1;
	};
}();
closure();
count = 10;
closure();
// */