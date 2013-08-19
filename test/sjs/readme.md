## Simplified JavaScript Interpreter

This directory contains an (jspg-based) implementation for an interpreter for a simple language similar to JavaScript (ES5). Assuming familiarity with the latter, the primary features of this language have been described below.

### Datatypes

* The following is the list of available datatypes: `undefined`, `boolean`, `integer`, `array`, `object`, `function`, `string`.
    * The `integer` type (which exists in place of the `number` type) has no upper limit as it is powered by a BigInt library. Since the representation uses arbitrary-length arrays, bit-wise operations have been not been implemented.
    * Note that the `array` type is not a subclass of the `object` type. Other than the numerical indices and "length", no other properties of an `array` instance are accessible.
    * The keys & values of an `object` instance can be sequentially accessed using the `for-in` loop. The `prototype` property of an `object` instance (instead of `__proto__`) points to the prototype `object`. Note that the `null` value has not been implemented.
    * The only accessible property of a `function` instance is "prototype" which can be used to set the default prototype for all objects created when this function is used as a constructor.
* Implicit type-casting allows you to perform binary (specifically arithmetic & comparison) operations on arbitrary values.
    * An `undefined` value may be upgraded to `boolean`, and that may in turn be upgraded to `integer` depending on whether or not the specific operation is defined for that datatype.
    * In case instances of the `array`, `object`, `function` or `string` types appear in a binary expression, both operands are upgraded to the `string` type before the operation is performed.
    * Note that these rules do not apply to the logical operators (`&&` and `||`), whose operands do not interact and can be individually evaluated as necessary.
* There are no default prototypes for instances of the above datatypes (with the exception of objects created using a `function` as a constructor). It is therefore suggested that custom wrapper classes be used to provide the necessary convenience functions.

### Variables & Scope

* Function-level scope with closure has been implemented.
* Both the dot-notation & square-brackets can be used to access properties of an `array`, `object` or `function`.
* The `delete` keyword can be used to discard references currently in scope.
* Inside a function, the `arguments` variable is an `array`-like `object` with additional references to the `callee` & `caller` functions.
* Inside a constructor (ie, a function that is called with the `new` keyword), the `this` variable is points to a new otherwise empty object, with a reference to the function's prototype.
    * In case of a normal function, the `this` variable is undefined, and so the following code is perfectly valid: `function(x){ if(!this) return new arguments.callee(x); ... }`
* The `local` variable provides a reference to the `object` serving as the current namespace, similar to the `global` or `window` objects at the top-level.

### Control Flow

* The following constructs & statements have been implemented: `if`, `while`, `do-while`, `for`, `for-in`, `try-catch`, `return`, `continue`, `break`, `throw`.
* The format of the `for-in` statement has been modified to `for([var] i[,j[,k]] in exp){ ... }` where square-brackets indicate optional sections.
    * The first variable contains the current array-index or object-key.
    * The second variable contains the corresponding array-item or object-property.
    * The third variable points to the value of the expression which must be an `array` or an `object`.
* The `try-catch` block has the format: `try { ... } catch(e) { ... }`.
	* The `finally` clause has not been implemented.
	* Multiple conditional `catch` blocks have not been implemented.
	* The catch variable is non-optional and contains the value of the exception.
* Note that `for-in` and `try-catch` blocks do not include a scope change. Thus, the original values of the variables used in the construct will likely be overwritten.