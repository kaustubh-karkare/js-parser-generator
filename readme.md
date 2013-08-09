
## JavaScript Parser Generator

    node test/basic # basic grammar constructs
    node test/async # asynchronous evaluation of patterns
    node test/program # a simple programming language

## Usage

```javascript
var pg = require("./src"),
	parser = pg.buildParser( <string:grammar> , <object:config> ),
	result = parser.parse( <string:data> , <array:init> );
console.log(result);
```
## Notes

* This project is based on http://pegjs.majda.cz/. There are, however, differences in implementation.
* No external libraries nor JavaScript's inbuilt RegExp implementation have been used in the main code.