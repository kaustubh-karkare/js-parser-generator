
## JavaScript Parser Generator

    node test/basic.js # simple grammar constructs
    node test/program.js # basic programming language

## Usage

```javascript
var pg = require("./src"),
	parser = pg.buildParser( <string:grammar> , <object:config> ),
	result = parser.parse( <string:data> , <array:init> );
console.log(result);
```
## Notes

* This project is based on http://pegjs.majda.cz/. There are, however, differences in implementation.
* JavaScript's inbuilt RegExp implementation has not been used anywhere.