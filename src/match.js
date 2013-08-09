
module.exports = {

	// Root Node

	"production" : function(state){
		state.log(1,"<production>",this.name);
		// initialize data object
		var data = {};
		for(var i=0;i<this.labels.length;++i)
			data[this.labels[i]] = [];
		state.labelled.push(data);
		var temp = this.pattern.match(state);
		state.labelled.pop();
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
			state.mismatch(JSON.stringify(this.data));
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
				j = i+1<this.data.length && this.data[i]==="\\"; // escaped?
				k = i+2<this.data.length && this.data[i+1]==="-" && !j; // range?
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
			state.mismatch(JSON.stringify(this.display).slice(1,-1));
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
				state.top( local = state.local(null) );
				if(local===null){
					state.log(2,"</and>","mismatch");
					state.pop();
					return null;
				}
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
				state.top( local = state.local(null) );
				if(local===null){
					state.log(2,"</or>","mismatch");
					state.pop();
					return null;
				}
			}
		}
		throw new Error("The cats are plotting world domination.");
	},

	"loop" : function(state){
		var local = state.push(state.local({ list:[], next:this.greedy }));
		var temp, k;
		if(this.greedy){
			while(local.next && local.list.length < this.maximum){
				state.log(2,"<loop>",this.pattern,this.minimum,this.maximum,this.greedy,local);
				// only if a restoration process after a mismatch is not ongoing
				if(local.list.length >= this.minimum && state.redirect.length===0){
					// save the decision to do one thing
					local.next = false;
					state.save();
					local.next = true;
				}
				// then do the opposite
				temp = this.pattern.match(state);
				if(temp===null){
					state.top( local = state.local(local) );
					if(local===null){
						state.log("</loop>","mismatch");
						state.pop();
						return null;
					}
				} else local.list.push(temp);
			}
		} else { // if not greedy
			state.log(2,"<loop>",this.pattern,this.minimum,this.maximum,this.greedy,local);
			// initially match the minimum number of times
			while(local.list.length < this.minimum){
				temp = this.pattern.match(state);
				if(temp===null){
					state.log("</loop>","mismatch");
					state.pop(); // pop localdata
					return state.local(); // pop null
				} else local.list.push(temp);
			}
			// then optionally add more
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
				state.mismatch("<lookahead>");
				if(state.redirect[0]===null) return state.local();
			}
		}
	},

	// Interactive Nodes

	"label" : function(state){
		state.log(2,"<label>",this.name);
		var temp = this.pattern.match(state);
		if(temp){
			var last = state.labelled[state.labelled.length-1];
			last[this.name].push(temp);
		}
		state.log(2,"</label>",this.name,temp);
		return temp;
	},

	"action" : function(state){
		state.log(2,"<action>");
		var temp = this.pattern.match(state);
		if(temp){
			var last = state.labelled[state.labelled.length-1];
			last = prepare(last,!state.parser.config.lazyeval);
			if(state.parser.config.unwrap) last = unwrap(last);
			var args = {
				"data": last,
				"env": state.env,
				"context": state.context,
				"code": this.code,
				"config": state.parser.config,
			};
			temp = node(args);
			// TODO: Attach internal string data to the AST functions for predicates
		}
		state.log(2,"</action>",temp);
		return temp;
	},

	"predicate" : function(state){
		state.log(2,"<predicate>",this.labels,this.code);
		while(true){
			var last = prepare(state.labelled[state.labelled.length-1],false);
			if(state.parser.config.unwrap) last = unwrap(last);
			var that = {
				index: state.index, // if increased, will cause state.index to increase too
				result: null, // the string returned to the calling function
				expected: null // expected pattern, which was not found
			};

			for(var key in that) state.context[key] = that[key];
			var result = (function(){
				var ast, state, module; // hide global
				var data, that, key, result; // hide local
				return arguments[0]("(function(" + arguments[1].join(",") + ")" + arguments[4] + ")").apply(
					arguments[3], arguments[1].map((function(x){ return this[x]; }).bind(arguments[2])) );
			}).call( null, state.env, Object.keys(last), last, state.context, this.code );
			for(var key in that) that[key] = state.context[key];

			state.log(2,"</predicate>",result,that.result);
			if(this.positive === !!result){
				if(that.index>state.index) state.index = that.index;
				return that.result!==null ? new custom(that.result) : "";
			} else {
				if(state.redirect.length>0) return null;
				state.mismatch(that.expected);
				if(state.redirect[0]===null) return state.local();
			}
		}
	}

};

var node = function(args){
	var labels = Object.keys(args.data);
	return args.env(
		"(function(){" + (args.config.lazyeval?"var args = Array.prototype.slice.call(arguments);":"") +
		(args.config.async ? " var callback = args.pop(); if(typeof(callback)!==\"function\") " +
			"throw new Error(\"Callback Not Provided!\"); " : "") +
		"return (function(" + labels.join(",") + ")" + args.code + ").apply(this.context,[" +
		labels.map(function(x){ return "this.data."+x; }).join(",") + "]); })"
	).bind(args);
};

// Used to wrap the data provided by the user through predicates
// to prevents the evalnow function from traversing it.
var custom = function(data){ this.data = data; };

// Used to collect data before being provided as arguments to actions & predicates.
var prepare = function(data,evalnow){
	if(typeof(data)==="string") return data;
	else if(typeof(data)==="function") return evalnow ? data() : data;
	else if(data instanceof custom) return data.data;
	else if(typeof(data)==="object" && data!==null){
		var result = Array.isArray(data) ? new Array(data.length) :{};
		for(var key in data) result[key] = arguments.callee(data[key],evalnow);
		return result;
	}
};

var unwrap = function(data){
	var result = {};
	for(var key in data)
		if(data[key].length===0) result[key] = null;
		else if(data[key].length===1) result[key] = data[key][0];
		else result[key] = data[key];
	return result;
};