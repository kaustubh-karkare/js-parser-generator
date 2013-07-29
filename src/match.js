
var ast = require("./ast");

module.exports = {

	// Root Node

	"production" : function(state){
		state.log(1,"<production>",this.name);
		state.predicate.push(null);
		var temp = this.pattern.match(state);
		state.predicate.pop();
		state.log(1,"</production>", this.name, temp);
		return temp;
	},

	// Leaf Nodes

	"empty" : function(state){
		state.log(2,"<empty/>");
		return state.match("");
	},

	"string" : function(state){
		var t = state.data.substr(state.index,this.data.length);
		state.log(2,"<string/>",this.data,t);
		if(this.data===t || this.ignoreCase && this.data.toLowerCase()===t.toLowerCase()){
			return state.match(t);
		} else {
			state.mismatch(this.data);
			return state.local(); // null
		}
	},

	"range" : function(state){
		var found = false, c = state.data[state.index];
		if(c!==undefined){
			var ci = (c.toUpperCase()===c ? c.toLowerCase() : c.toUpperCase()),
				cc = c.charCodeAt(),
				cci = ci.charCodeAt();
			for(var i=0,j,k,l; !found && i<this.data.length; ++i){
				j = i+1<this.data.length && this.data[i]==="\\";
				k = i+2<this.data.length && this.data[i+1]==="-" && !j;
				if(k){
					j = this.data[i].charCodeAt();
					k = this.data[i+=2].charCodeAt();
					if(j>k){ l=j; j=k; k=l; }
					if(j<=cc && cc<=k || this.ignoreCase && j<=cci && cci<=k) found = true;
				} else {
					if(j) ++i;
					if(c===this.data[i] || this.ignoreCase && ci===this.data[i]) found = true;
				}
			}
		}
		state.log(2,"<range/>",this.display,c,found^this.negative);
		if(c && found^this.negative) return state.match(c);
		else {
			state.mismatch(this.display);
			return state.local(); // null
		}
	},

	"reference" : function(state){
		state.log(2,"<reference>",this.name);
		var temp = state.parser.production[this.name].match(state);
		state.log(2,"</reference>", this.name);
		return temp;
	},

	// Flow Control Operations

	"and" : function(state){
		var local = state.push(state.local({ series:[] })), temp;
		while(local.series.length < this.series.length){
			state.log(2,"<and>",this.series,local.series);
			temp = this.series[local.series.length].match(state);
			if(temp!==null){
				local.series.push(temp);
			} else {
				local = state.local(null);
				if(local===null){
					state.log(2,"</and>","mismatch");
					state.pop();
					return null;
				}
				else state.top(local);
			}
		}
		temp = state.pop().series;
		state.log(2,1,"</and>",temp);
		return temp;
	},

	"or" : function(state){
		var local = state.push(state.local({ choice:0 })), temp;

		while(local.choice < this.options.length){
			state.log(2,"<or>",this.options,local.choice);

			// save next alternative & match current option
			if(state.redirect.length===0){
				if(++local.choice < this.options.length) state.save();
				--local.choice;
			}
			temp = this.options[local.choice].match(state);

			if(temp!==null){
				state.log(2,"</or>",temp);
				state.pop();
				return temp;
			} else {
				local = state.local(null);
				if(local===null){
					state.log(2,"</or>","mismatch");
					state.pop();
					return null;
				}
				else state.top(local);
			}
		}
		throw new Error("The cats are plotting world domination.");
	},

	"loop" : function(state){
		var local = state.push(state.local({ list:[], next:this.greedy }));
		var temp, k;
		if(this.greedy){
			while(local.next && local.list.length < this.maximum){
				state.log(2,"<loop>",this.pattern,this.maximum,this.greedy,local);
				if(state.redirect.length===0){
					// save the decision to do one thing
					local.next = false;
					state.save();
					local.next = true;
				}
				// then do the opposite
				temp = this.pattern.match(state);
				if(temp===null) local = state.local(local);
				else local.list.push(temp);
			}
		} else { // if not greedy
			if(local.list.length<this.maximum){
				temp = this.pattern.match( clone = state.clone() );
				if(temp!==null){
					clone.top().list.push(temp);
					clone.save();
					state.alternative.push( clone.alternative.pop() );
				}
			}
		}
		temp = state.pop().list;
		state.log(2,1,"</loop>",temp);
		return temp;
	},

	"lookahead" : function(state){
		state.log(2,"<lookahead>");
		while(true){
			var index = state.index;
			var temp = this.pattern.match(state);
			state.index = index;
			state.log(2,"</lookahead>",temp);
			if(this.positive===!!temp){
				return "";
			} else {
				if(state.redirect.length>0) return null;
				state.mismatch(this);
				if(state.redirect[0]===null) return state.local();
			}
		}
	},

	// Interactive Nodes

	"label" : function(state){
		state.log(2,"<label>",this.name);
		var temp = this.pattern.match(state);
		if(temp){
			// provide data to nearest action
			var last = state.namedata[state.namedata.length-1];
			last[this.name].push(temp);
			// provide data to nearest predicate
			last = state.predicate[state.predicate.length-1];
			if(last) last[this.name].push(temp);
		}
		state.log(2,"</label>",this.name,temp);
		return temp;
	},

	"action" : function(state){
		state.log(2,"<action>");
		// prepare the data object and match
		var data = {};
		for(var i=0; i<this.labels.length; ++i)
			data[this.labels[i]] = [];
		state.namedata.push(data);
		var temp = this.pattern.match(state);
		data = state.namedata.pop(); // data can be undefined if names are specified outside actions
		
		if(temp){
			if(state.config.unwrap){
				// remove unnecessary array wrappers
				for(var key in data)
					if(data[key].length===0) delete data[key];
					else if(data[key].length===1) data[key] = data[key][0];
			}

			var node = new ast( this.labels , only("eval",data) , state.env, this.code );
			// save string data only if a predicate node is an ancestor
			if(state.predicate.filter(function(p){ return !!p; }).length>0)
				node.str = only("str",temp);
			temp = node;
		}
		state.log(2,"</action>",temp);
		return temp;
	},

	"predicate" : function(state){
		var temp, data, result;
		state.log(2,"<predicate>",this.labels);
		while(true){
			// prepare the data object
			data = {};
			for(var i=0; i<this.labels.length; ++i)
				data[this.labels[i]] = [];

			// process pattern
			state.predicate.push(data);
			temp = this.pattern.match(state);
			data = state.predicate.pop();
			if(temp===null) return null;

			if(state.config.unwrap){
				// remove unnecessary array wrappers & replace ast nodes
				for(var key in data)
					if(data[key].length===0) delete data[key];
					else if(data[key].length===1) data[key] = data[key][0];
			}

			data = only("str",data);
			// run predicate code
			result = this.positive === !!state.env("(function(" + this.labels.join(",") + ")" +
				this.code + ")").apply( null, this.labels.map(function(x){ return data[x]; }) );

			if(result){
				state.log(2,"</predicate>",data);
				return temp;
			} else {
				if(state.redirect.length>0) return null;
				state.mismatch(this);
				if(state.redirect[0]===null) return state.local();
			}
		}
	}

};

var only = function(attr,data){
	if(typeof(data)==="string") return data;
	else if(data instanceof ast) return data[attr];
	else if(typeof(data)==="object" && data!==null){
		var result = Array.isArray(data) ? [] : {};
		for(var key in data) result[key] = arguments.callee(attr,data[key]);
		return result;
	}
};