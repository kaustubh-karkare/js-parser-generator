
var being = function(name,age){
	if(!this) return new arguments.callee(name,age);
	this.name = name;
	this.age = age;
	this.str = function(){ return this.name+this.slash+this.age; };
};

being.prototype = {"slash":"/"};

var animal = function(species,name,age){
	this.species = species;
	this.prototype = new being(name,age);
	this.str = function(){ return this.species+me.slash+this.prototype.str(); };
};

var me = new animal("human","kaustubh",22);
me.slash = "-";
me.str();
me.species + me.slash + me.name + me.slash + me.age;