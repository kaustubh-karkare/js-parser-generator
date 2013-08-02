
module.exports = function(lib,src){
	
	// primitive datatypes in increasing order of size
	var ordering = ["boolean","number"];
	var datatype = new Array(ordering.length);
	for(var i=0;i<ordering.length;++i)
		datatype[i] = src.primitive[ordering[i]];

	var typecast = function(data){
		var i, largest = -1, type = [];
		for(i=0; i<data.length; ++i){
			type[i] = datatype.indexOf(data[i].constructor);
			largest = Math.max(largest,type[i]);
		}
		for(i=0; i<data.length; ++i)
			data[i] = new datatype[largest](data[i],type[i]);
		return data;
	};

	return function(op){
		var args = Array.prototype.slice.call(arguments,1);
		if(op==="===" || op==="!=="){ // special case
			if(args[0].constructor===args[1].constructor) op=op.substr(0,2);
			else return src.primitive.boolean[op[0]==="!"];
		}
		args = typecast(args); // implicit type casting
		return args[0].operator.apply(args[0],[op].concat(args.slice(1)));
	};

};