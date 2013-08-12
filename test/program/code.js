
square = [0,1,4,9,16,25,36,49,64,81,100],
x = {
	"int":1,
	"str":"two",
	"arr":[3,4],
	"obj":{"a":"b","c":"d"},
	"fn":function(x){ return x*x; }
},
"init";

square[2+3];
x.fn(13);

1 + 25 * 20 + 4 / 2 - 13%10 ; // arithmetic operations
!true - (-1) + "2"; // implicit type casting
1<2 ? -1>-2 ? 42 : -666 : -666 ; // ternary operator
if(1==true && -Infinity < +Infinity) 0/0; else 666; // if statement

factorial = function(limit){
	integer result = 1;
	for(integer i=2; i<=limit; i+=1) result*=i;
	return result;
};
factorial(5);
factorial(50);

closure = function(){
	integer count = 1;
	return function(){
		return count+=1;
	};
}();
closure();
closure();
