
var a = 0;

try {
	a += 1;
	throw a;
	a *= -1;
} catch(e){
	a += 1;
}

"checkpoint="+a;

try {
	a += 1;
} catch(e){
	a += 1;
}

"checkpoint="+a;