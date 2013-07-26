
var ast = require("./ast");

module.exports = {

	// Root Node

	"production" : function(state){
		state.log(1,"<production>",this.name);
		state.namedata.push({});
		var temp = this.pattern.match(state);
		state.namedata.pop();
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
		if(this.data===t) return state.match(t);
		else return state.mismatch(this.data);
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
		if(found^this.negative) return state.match(c);
		else return state.mismatch(this.display);
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
		return Array.prototype.concat.apply([],temp); // merge subarrays
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
		return Array.prototype.concat.apply([],temp);
	},

	"lookahead" : function(state){
		state.log(2,"<lookahead>",this.name);
		var index = state.index;
		var temp = this.pattern.match(state);
		state.log(2,"</lookahead>",this.name,temp);
		if(temp) state.index = index;
		return temp;
	},

	// Interactive Nodes

	"label" : function(state){
		state.log(2,"<label>",this.name);
		var temp = this.pattern.match(state);
		var last = state.namedata[state.namedata.length-1];
		state.log(2,"</label>",this.name,temp);
		if(temp) last[this.name] = (last[this.name] || []).concat(temp);
		return temp;
	},

	"action" : function(state){
		state.log(2,"<action>");
		state.namedata.push({});
		var temp = this.pattern.match(state);
		var data = state.namedata.pop();  // data can be undefined if names are specified outside actions
		if(temp){
			for(var key in data)
				if(data[key].length===0) delete data[key];
				else if(data[key].length===1) data[key] = data[key][0];
			temp = new ast( this.labels , data || {} , this.code );
		}
		state.log(2,"</action>",temp);
		return temp;
	},

	"predicate" : function(state){
		state.log(2,"<predicate>");
		// state.namedata.push({});
		var temp = this.pattern.match(state);
		// var data = state.namedata.pop();
		state.log(2,"</predicate>");
		return temp;
	}

};