
var exp_generic = function(operation){
	return function(env){
		var value = this.data.left[0].evaluate(env);
		if(this.data.operator)
			while(this.data.operator.length)
				value = operation[ this.data.operator.shift() ]( value, this.data.right.shift().evaluate(env) );
		return value;
	};
};

module.exports = {

	"block" : function(env){
		return this.data.list.map(function(x){ return x.evaluate(env); });
		for(var i=0; i<this.data.list.length; ++i)
			this.data.list[i].evaluate(env);
	},

	"statement" : function(env){
		return this.data.value[0].evaluate(env);
	},

	"integer" : function(env){
		if(this.value===undefined){
			this.value = parseInt(this.data.string);
			delete this.data;
		}
		return this.value;
	},

	"variable" : function(env){
		return env[this.data.string];
	},

	"primary" : function(env){
		return this.data.value[0].evaluate(env);
	},

	"exp1" : exp_generic({
		"+" : function(x,y){ return x+y; },
		"-" : function(x,y){ return x-y; },
	}),

	"exp2" : exp_generic({
		"*" : function(x,y){ return x*y; },
		"/" : function(x,y){ return x/y; },
		"%" : function(x,y){ return x%y; },
	}),

	"exp3" : function(env){
		return this.data.value[0].evaluate(env);
	}

};