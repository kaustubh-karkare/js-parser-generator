
/*
Big Integers are represented using an array of integers, each of which
stores a postionally significant part of the actual number. Each array element has a
maximum value that is a power of 2 in order to maximize memory utilization & simplify
the implementation bitwise operations, at the cost of complicating the conversion to
and from decimal strings.

bits = number of bits to be used for storage in an integer value
intmax = maximum integer value beyond which storage becomes imprecise
slot = the maximum value that can be stored in an array element
alnum = recognized alphanumeric characters in the number's string representation
*/

var bits = 26, intmax = 1<<53, slot = 1<<bits;
var alnum = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

var bigint = function(init,init2){
	if(!(this instanceof bigint)) return new bigint(init,init2);
	if(typeof(init)==="number"){
		if(init===+Infinity){ this.s = 1; this.d = null; }
		else if(init===-Infinity){ this.s = -1; this.d = null; }
		else if(init!==init){ this.s = null; this.d = null; }
		else if(Math.abs(init)>intmax) throw new Error("Imprecise Integer Value");
		else {
			if(init<0){ init*=this.s=-1; }
			else this.s = 1;
			this.d = conv.int2array(Math.floor(init)); // ignoring non-integral part
		}
	} else if(typeof(init)==="string"){
		if(init==="Infinity" || init==="+Infinity"){ this.s = 1; this.d = null; }
		else if(init==="-Infinity"){ this.s = -1; this.d = null; }
		else if(init==="NaN"){ this.s = null; this.d = null; }
		else {
			var base = init2 || 10;
			if(typeof(base)!=="number" || base<2 || base>alnum.length) throw new Error("Invalid Base");
			var chars = alnum.slice(0,base);
			var part = RegExp("^([+-])?(["+chars+"]+)$","i").exec(init);
			if(!part) throw new Error("Invalid Number Format");
			this.s = (part[1]==="-"?-1:1);
			this.d = conv.str2array(part[2]||"",chars);
		}
	} else if(typeof(init)==="object"){
		this.d = init.d; // base
		this.s = init.s; // sign
	}
};

// Conversion of arrays to/from other datatypes.
var conv = {
	int2array : function(int){
		if(int>intmax) throw new Error("Imprecise Integer Value");
		var result = [];
		for(var i=0; int; ++i, int=Math.floor(int/slot)) result.push(int%slot);
		return result;
	},
	array2int : function(arr){
		var result = 0, base = 1;
		for(var i=0; i<arr.length; ++i, base*=slot) result += base*arr[i];
		return result>intmax?Infinity:result;
	},
	str2array : function(str,chars){
		var result = [], base = [1];
		for(var i=str.length-1; i>=0; --i, base=calc.multiply(base,bigint[chars.length].d))
			result = calc.add(result,calc.multiply(base,bigint[chars.indexOf(str[i].toUpperCase())].d));
		return result;
	},
	array2str : function(original,chars){
		var str = "";
		for(var a=original.slice(), b; a.length; a=b[0]){
			b = calc.divmod(a,bigint[chars.length].d);
			str = chars[this.array2int(b[1])]+str;
		}
		return str.length ? str : "0";
	}
};

// Digit Array Operations
var calc = {

	// Assumptions: 0<=a, 0<=b<=intmax, b is an integer, not an array
	leftShift : function(a,b){
		var i,j,k, c = a.slice();
		for(i=0,j=Math.floor(b/bits); i<j || (b%=bits) && 0; ++i) c.unshift(0);
		for(j=0; i<c.length || j && c.push(j) && 0; ++i, j=k){
			k = ((1<<b)-1) & (c[i]>>bits-b);
			c[i] = (c[i]<<b) & ((1<<bits)-1) | j;
		}
		return c;
	},
	rightShift : function(a,b){
		var i,j,k, c = a.slice(Math.floor(b/bits));
		b%=bits;
		for(i=c.length-1; i>=0; --i, j=k){
			k = ((1<<b)-1) & c[i];
			c[i] = (c[i]>>b) | (j<<(bits-b));
		}
		while(c[c.length-1]===0) c.pop();
		return c;
	},

	// Bitwise Operations
	bitwiseAnd : function(a,b){
		var c = new Array(Math.min(a.length,b.length));
		for(var i=0;i<c.length;++i) c[i] = a[i] & b[i];
		return c;
	},
	bitwiseOr : function(a,b){
		var c = new Array(Math.max(a.length,b.length));
		for(var i=0;i<c.length;++i) c[i] = (a[i]||0) | (b[i]||0);
		return c;
	},
	bitwiseXor : function(a,b){
		var c = new Array(Math.max(a.length,b.length));
		for(var i=0;i<c.length;++i) c[i] = (a[i]||0) ^ (b[i]||0);
		while(c[c.length-1]===0) c.pop();
		return c;
	},

	// Arithmatic Operations
	compare : function(a,b){
		for(var k=Math.max(a.length,b.length)-1, i=k, j=k, x,y; i>=0; --i,--j )
			if((x=a[i]||0)!=(y=b[i]||0)) return x<y?-1:1;
		return 0;
	},
	add : function(a,b){
		var sum = new Array(Math.max(a.length,b.length)), carry = 0;
		for(var i=0, j=0, k=0; k<sum.length; ++i, ++j, ++k)
			sum[k] = (sum[k]=(a[i]||0)+(b[j]||0)+carry) - slot*(carry=(sum[k]>=slot?1:0));
		if(carry!==0) sum.push(carry);
		return sum;
	},
	subtract : function(a,b){
		var diff = new Array(Math.max(a.length,b.length)), carry = 0;
		for(var i=0, j=0, k=0; k<diff.length; ++i, ++j, ++k)
			diff[k] = (diff[k]=(a[i]||0)-(b[j]||0)-carry) + slot*(carry=(diff[k]<0?1:0));
		while(diff[diff.length-1]===0) diff.pop();
		return diff;
	},
	multiply : function(a,b){ // assumption: neither is zero
		var product = new Array(a.length+b.length), carry = 0;
		var l = 0;
		for(var i=0, j, k; i<a.length || void(product[product.length-1]===0?product.pop():0); ++i)
			for(j=0; j<b.length && !void(k=i+j) || (k=i+j, product[k]=(product[k]||0)+carry, carry=0); ++j)
				product[k] = (product[k]=(product[k]||0)+a[i]*b[j]+carry) - slot*(carry=Math.floor(product[k]/slot));
		return product;
	},
	divmod : function(a,b){ // assumption: neither is zero
		for(var left=[], right=[1]; this.compare(this.multiply(right,b),a)<0; right=this.leftShift(right,1) ) left=right;
		// the variables d1 & d2 store [right-left] in successive cycles, and if equal, will trigger loop termination
		for(var d1=[], d2, mid; (d2=this.subtract(right,left)).length && this.compare(d1,d2) && (d1=d2); ){
			mid = this.rightShift(this.add(left,right),1); // mid = (left+right)>>1;
			if(this.compare(this.multiply(b,mid),a)<0) left=mid; else right=mid; // b*mid<a ? left:right = mid;
		}
		for(mid=right; this.compare(a,right=this.multiply(mid,b))<0; mid=this.subtract(mid,[1]));
		return [mid,this.subtract(a,right)];
	},
	divide : function(a,b){ return this.divmod(a,b)[0]; },
	modulus : function(a,b){ return this.divmod(a,b)[1]; },
};

var special = function(x){ return x.d? null : x.s>0? "+inf" : x.s<0 ? "-inf" : "nan"; };

bigint.prototype = {
	"toNumber": function(){
		if(this.s===null) return NaN;
		else if(this.d===null) return this.s*Infinity;
		else return this.s*conv.array2int(this.d);
	},
	"toString": function(base){
		if(this.s===null) return "NaN";
		else if(this.d===null) return (this.s>0?"":"-")+"Infinity";
		if(base===undefined) base = 10;
		else if(typeof(base)!=="number" || base<2 || base>alnum.length) throw new Error("Invalid Base");
		return (this.s===-1?"-":"")+conv.array2str( this.d, alnum.slice(0,base) );
	},
	"negative": function(){
		var that = new bigint(this);
		if(that.s) that.s *= -1;
		return that;
	},
	"add": function(b){
		var a = this, c = new bigint(this);
		var sa = special(a), sb = special(b);
		if(sa || sb)
			if(sa==="nan" || sb==="nan" || sa==="+inf" && sb==="-inf" || sa==="-inf" && sb==="+inf")
				return bigint.nan;
			else if(sa==="+inf" || sb==="+inf") return bigint.pinf;
			else if(sa==="-inf" || sb==="-inf") return bigint.ninf;
			else throw new Error("Meow");
		if(a.s===b.s) c.d = calc.add(a.d,b.d);
		else {
			var z = calc.compare(a.d,b.d);
			if(z>0){ c.s = a.s; c.d = calc.subtract(a.d,b.d); }
			else { c.s = b.s; c.d = calc.subtract(b.d,a.d); }
			if(c.d.length===0) c.s = 1;
		}
		return c;
	},
	"subtract": function(that){
		that = new bigint(that);
		that.s *= -1;
		var diff = this.add(that);
		that.s *= -1;
		return diff;
	},
	"multiply": function(that){
		var sa = special(this), sb = special(that);
		if(sa || sb)
			if(sa==="nan" || sb==="nan") return bigint.nan;
			else if((sa==="-inf")^(sb==="-inf")) return bigint.ninf;
			else return bigint.pinf;
		if(!this.d.length || !that.d.length) return bigint[0];
		else return new bigint({"d":calc.multiply(this.d,that.d),"s":this.s*that.s});
	},
	"dividedBy": function(that){
		var sa = special(this), sb = special(that);
		if(sa || sb)
			if(sa==="nan" || sb==="nan" || sa && sb) return bigint.nan;
			else if(sa==="+inf" && !sb) return bigint.pinf;
			else if(sa==="-inf" && !sb) return bigint.ninf;
			else if(!sa && sb) return bigint[0];
		if(!that.d.length) return !this.d.length ? bigint.nan : (this.s===1 ? bigint.pinf : bigint.ninf);
		else return !this.d.length ? bigint[0] :
			new bigint({"d":calc.divide(this.d,that.d), "s":this.s*that.s});
	},
	"modulus": function(that){
		var sa = special(this), sb = special(that);
		if(sa || sb)
			if(sa==="nan" || sb==="nan") return bigint.nan;
			else if(!sa && sb) return this;
			else if(sa) return bigint.nan;
		return that.d.length===0 ? bigint.nan : this.d.length===0 ? bigint[0] :
			new bigint({"d":calc.modulus(this.d,that.d), "s":this.s});
	},
	// Comparison Operators
	"equalTo": function(that){ var diff = this.subtract(that); return diff.s && diff.d && !diff.d.length; },
	"lessThan": function(that){ var diff = this.subtract(that); return diff.s<0 && (!diff.d || diff.d.length); },
	"greaterThan": function(that){ var diff = this.subtract(that); return diff.s>0 && (!diff.d || diff.d.length); },
	"notEqualTo": function(that){ var diff = this.subtract(that); return !diff.s || !diff.d || diff.d.length; },
	"lessThanOrEqualTo": function(that){ var diff = this.subtract(that); return diff.s<0 || diff.d && !diff.d.length; },
	"greaterThanOrEqualTo": function(that){ var diff = this.subtract(that); return diff.s>0 || diff.d && !diff.d.length; },
};

var shortname = {
	"toNumber": "num",
	"toString": "str",
	"negative": "neg",
	"subtract": "sub",
	"multiply": "mul",
	"dividedBy": "div",
	"modulus": "mod",
	"power": "pow",
	"equalTo": "eq",
	"lessThan": "lt",
	"greaterThan": "gt",
	"notEqualTo": "neq",
	"lessThanOrEqualTo": "lte",
	"greaterThanOrEqualTo": "gte"
};

for(var name in shortname)
	bigint.prototype[shortname[name]] = bigint.prototype[name];

// Commonly Used & Single Digit Values
bigint.nan = new bigint(NaN);
bigint.pinf = new bigint(+Infinity);
bigint.ninf = new bigint(-Infinity);
for(var i=0; i<alnum.length; ++i) bigint[i] = new bigint(i);

module.exports = bigint;



/*
console.log(bigint(2).pow(bigint(11)).str());
var factorial = function(x){ return x.eq(bigint[1])?x:x.mul(factorial(x.sub(bigint[1]))); };
var intmaxsqrt = Math.floor(Math.sqrt(intmax));
test: for(var i=0,j,k; ;++i){
	var a = Math.floor(Math.random()*intmaxsqrt);
	var b = Math.floor(Math.random()*intmaxsqrt);
	var c = Math.floor(Math.random()*intmax);
	var ba = new bigint(a), bb = new bigint(b), bc = new bigint(c);
	
	j = 0;
	if( a+b + "" !== ba.add(bb).str() ) break; else ++j;
	if( a-b + "" !== ba.sub(bb).str() ) break; else ++j;
	if( a*b + "" !== ba.mul(bb).str() ) break; else ++j;
	if( Math.floor(c/a)+"" !== bc.div(ba).str() ) break; else ++j;
	if( c%a+"" !== bc.mod(ba).str() ) break; else ++j;
	if( (a<b) !== (ba.lt(bb)) ) break; else ++j;
	if( (a>b) !== (ba.gt(bb)) ) break; else ++j;
	if( (a==b) !== (ba.eq(bb)) ) break; else ++j;
	console.log("Match",a,b,c);
}
console.log("Mismatch",a,b,c,j);
*/