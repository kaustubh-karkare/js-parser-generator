
var ast = require("./ast"),
	util = require("./util");

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
		return "";
	},

	"string" : function(state){
		var t = state.data.substr(state.index,this.data.length);
		state.log(2,"<string/>",this.data,t);
		if(this.data===t){
			state.index += t.length;
			return t;
		} else {
			state.mismatch();
			return null;
		}
	},

	"range" : function(state){
		var i, m = 0,
			c = state.data[state.index],
			cc = !c ? -1 : c.charCodeAt(),
			cci = !(c && this.ignoreCase) ? -1 :
				( c===(i=c.toUpperCase()) ? c.toLowerCase() : i ).charCodeAt() ;
		if(cc!==-1){
			if(cc===cci) cci = -1;
			for(i=0; !m && i<this.start.length; ++i)
				if( this.start[i]<=cc && cc<=this.end[i] ||
					cci && this.start[i]<=cci && cci<this.end[i] ) m = 1;
			if(!m)
				if(	this.individual.indexOf(cc)!==-1 ||
					cci && this.individual.indexOf(cci)!==-1 )
					m = 1;
		}
		state.log(1,"<range/>",this.regexp,c,m);
		if(m^this.negative){
			state.index++;
			return c;
		} else {
			state.mismatch();
			return null;
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
				} else state.top(local);
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
			if(++local.choice < this.options.length) state.save();
			temp = this.options[--local.choice].match(state);

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
				/*
				The last element of state.localdata needs to be synced with local so that in case of mismatch,
				the lowest common ancestor of current astnode & last decision point can be correctly identified.
				*/
				else state.top(local);
			}
		}
		throw new Error("Hacky is a Cat.");
	},

	"loop" : function(state){
		var local = state.push(state.local({ first:true, list:[] }));
		var i,j,k,temp;
		state.log(2,"<loop>",this.pattern,this.minimum,this.maximum,this.greedy,local.list);

		if(local.first){

			// Match at least the minimum number of 
			for(i=0; i<this.minimum; ++i){
				temp = this.pattern.match(state);
				if(temp!==null) local.list.push(temp);
				else break;
			}
			if(i<this.minimum){
				state.log(2,"</loop>","mismatch");
				state.local(null); // consume "null" from state.redirect
				state.pop();
				return null;
			}

		}

		if(this.greedy){

			if(local.first){

				state.save();
				k = state.alternative.length - 1;

				for(i=this.minimum; i<this.maximum; ++i){
					j = util.clone(state);
					temp = this.pattern.match(j);
					if(temp===null) break;
					state.sync(j);
					local = state.top();
					local.list.push(temp);
				}
				
				if(local.list.length===this.minimum){
					state.alternative.splice(k,1);
				} else {
					temp = state.alternative[k].localdata;
					temp[temp.length-1].first = false;
					temp[temp.length-1].list = local.list.slice(0,-1);
				}

			} else {

				temp = local.list.pop();
				if(local.list.length>this.minimum) state.save();
				local.list.push(temp);

			}

		} else { // if not greedy

			if(local.first) local.first = false;

			k = util.clone(state);
			temp = this.pattern.match( k );
			if(temp!==null){
				i = k.top(); i.list.push(temp); k.top(i);
				k.save();
				state.alternative.push( k.alternative.pop() );
			}

		}

		temp = state.pop().list;
		state.log(2,1,"</loop>",temp);
		return Array.prototype.concat.apply([],temp); // merge subarrays
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
		var last = state.namedata[state.namedata.length-1] || {};
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