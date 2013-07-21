
var util = {
	clone : function(obj){
		var result = obj; // null, undefined, number, string, function
		if(obj instanceof RegExp){ // regexp
			result = new RegExp( obj.source,
				(obj.ignoreCase?"i":"") +
				(obj.global?"g":"") +
				(obj.multiline?"m":"") );
			result.lastIndex = obj.lastIndex;
		} else if(obj && typeof(obj)==="object"){ // array, object
			var a = Array.isArray(obj);
			result = a ? new Array(obj.length) : {};
			for(var key in obj)
				if(obj.hasOwnProperty(key))
					result[key] = arguments.callee(obj[key]);
			if(!a) result.__proto__ = obj.__proto__; // inheritance
		}
		return result;
	},
	equals: function(obj1, obj2){
		return JSON.stringify(obj1)===JSON.stringify(obj2);
	}
};

module.exports = util;