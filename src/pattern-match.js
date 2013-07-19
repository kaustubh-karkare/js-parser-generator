
// Each type of node in the grammer rule tree structure has a different process for matching, as defined below:

module.exports = {

	"string" : function(state){
		var t = state.data.substr(state.index,this.data.length);
		state.log("<string/>",this.data,t);
		if(this.data===t){
			state.index += t.length;
			return t;
		} else {
			state.mismatch();
			return null;
		}
	},

	"regexp" : function(state){
		this.data.lastIndex = state.index;
		var t = this.data.exec(state.data);
		state.log("<regexp/>",this.data,t, t ? t.index : null, state.index);
		if(t!==null && t.index===state.index){
			state.index += t[0].length;
			return t[0];
		} else {
			state.mismatch();
			return null;
		}
	},

	"production" : function(state){
		state.log("<production>",this.name);
		state.namedata.push({});
		var temp = state.parser.production[this.name].match(state);
		if(temp!==null) temp = new state.parser.ast[this.name]( state.namedata.pop() );
		state.log("</production>", this.name, temp);
		return temp;
	},

	"and" : function(state){
		var local = state.push(state.local({ series:[] })), temp;
		while(local.series.length < this.series.length){
			state.log("<and>",this.name,this.series,local.series);
			temp = this.series[local.series.length].match(state);
			if(temp!==null){
				local.series.push(temp);
			} else {
				local = state.local(null);
				if(local===null){
					state.log("</and>","mismatch");
					state.pop();
					return null;
				} else state.top(local);
			}
		}
		temp = state.pop().series;
		if(this.name!==null && state.namedata.length>0){
			var last = state.namedata[state.namedata.length-1];
			if(temp.length===1) temp = temp[0];
			last[this.name] = (last[this.name] || []).concat(temp);
			/*
			if(!(this.name in last)) last[this.name] = temp;
			else if(!Array.isArray(last[this.name]))
				last[this.name] = new Array( last[this.name], temp );
			else last[this.name].push(temp);
			*/
		}
		state.log(1,"</and>",this.name,temp);
		return temp;
	},

	"or" : function(state){
		var local = state.push(state.local({ choice:0 })), temp;

		while(local.choice < this.options.length){
			state.log("<or>",this.options,local.choice);

			// save next alternative & match current option
			if(++local.choice < this.options.length) state.save();
			temp = this.options[--local.choice].match(state);

			if(temp!==null){
				state.log("</or>",temp);
				state.pop();
				return temp;
			} else {
				local = state.local(null);
				if(local===null){
					state.log("</or>","mismatch");
					state.pop();
					return null;
				}
				/*
				The last element of state.localdata needs to be synced with local so that in case of mismatch,
				the lowest common ancestor of current node & last decision point can be correctly identified.
				*/
				else state.top(local);
			}
		}
	},

	"loop" : function(state){
		var local = state.push(state.local({ first:true, list:[] }));
		var i,j,k,temp;
		state.log("<loop>",this.minimum,this.maximum,this.pattern,local.list);

		if(local.first){

			// Match at least the minimum number of 
			for(i=0; i<this.minimum; ++i){
				temp = this.pattern.match(state);
				if(temp!==null) local.list.push(temp);
				else break;
			}
			if(i<this.minimum){
				state.log("</loop>","mismatch");
				state.pop();
				return null;
			}

			state.save();
			k = state.alternative.length - 1;

			for(i=this.minimum; i<this.maximum; ++i){
				temp = this.pattern.match(state);
				if(temp!==null) local.list.push(temp);
				else { state.ignore(); break; }
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

		temp = state.pop().list;
		state.log(1,"</loop>",temp);
		return temp;
	}

};