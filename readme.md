
## JavaScript Parser Generator (JSPG)

### Examples

	node test/basic # basic grammar constructs
	node test/async # asynchronous evaluation of patterns
	node test/sjs # simplified javascript interpreter

The results of the above commands can be found in the `output.txt` files of each directory.

### Usage

```javascript
var pg = require("./src"),
	parser = pg.buildParser( <string:grammar> , <object:config> ),
	result = parser.parse( <string:data> , <array:init> );
console.log(result);
```

### Links

* [JSPG: Grammar Syntax & Semantics](grammar.md)
* [JSPG: Parser Configuration Options](config.md)
* [Simplified JavaScript Interpreter](test/sjs/readme.md)

### Notes

* This project is based on http://pegjs.majda.cz/. There are, however, differences in implementation.
* No external libraries nor JavaScript's inbuilt RegExp implementation have been used in the Parser Generator code.