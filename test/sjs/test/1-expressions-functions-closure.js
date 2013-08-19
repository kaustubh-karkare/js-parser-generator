
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