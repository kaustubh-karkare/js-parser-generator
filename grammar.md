
## JSPG: Grammar Syntax & Semantics

* The grammar file consists of one or more rules.

* The list of rules can be optionally preceded by an initialization code-block. The variables and functions defined here will be accessible from all other code-blocks.
	* Note that the `args` array contains initialization data that was provided when the Parser's `parse` function was called for this particular input.
	* In order for the Parser to function properly, there should be no top-level `return` statements in this block.

* Each rule has the format: `<rule-name> <alt-name> = <pattern> ;` where the `<rule-name>` is an identifier (ie, matches `/[$_A-Z][$_A-Z0-9]*/i`), `<alt-name>` is an optional string, and the semicolon at the end is also optional.


### Basic Pattern Units

#### String `"<data>"`

* The given string must exactly match the input data at the current position.
* Appending an `i` after the delimiting quote causes the match to be case insensitive.

#### CharRange `[$_A-Z]i`

* This matches a single character of the input data at the current position.
* Allowed characters are specified individually or using ranges, based on the RegExp format.
* Appending an `i` after the delimiting square-brackets causes the match to be case insensitive.

#### Positive/Negative Predicate `& {code}`

* Predicates specify the code to be executed at a particular point in the parsing process.
* In case of a positive predicate, if the boolean equivalent of the returned value is true, the match is considered successful.
* Replacing the `&` with `!` converts this into a negative predicate. In this case, if the boolean equivalent of the returned value is false, the match is considered successful.
* Within the current rule, labeled data that has already been matched is accessible using the label name. Note that if `config.lazyeval` is enabled, actions are represented using functions.
* The `this` object in this context has the following keys:
	* `config` A copy of the configuration object generated when the Parser was created. Do not modify this.
	* `data` The actual input string being parser. Do not modify this.
	* `index` An integer that is the current pointer position. It can be increased to advance the pointer.
	* `result` The value to be returned for later use in case of a match. Modify as needed.
	* `expected` A string explaining the problem in case of a mismatch. Modify as needed.

#### Reference `<rule-name>`

* This requires the pattern corresponding to the specified rule to be matched at the current position.
* Note that labels in one rule are inaccessible from another.


### Modifiers & Combinations

#### Labeled Pattern `<label>: <pattern>`

* The label is an identifier which will be used to reference the matched value in the predicate and/or action code-blocks of the current rule.
* The names `this`, `args` & `callback` are reserved, and cannot be used as label names.

#### Postive/Negative Lookahead `& <pattern>`

* A positive lookahead requires the specified pattern to be matched at the current position.
* Replacing `&` with `!` converts this into a negative lookahead, which requires that the pattern not match at the current position.
* In both cases, the current position is reset at the end of the process to what it was before.

#### Loop `<pattern> *`

* The modifier allows the pattern to be matched any number of times. Replacing the `*` with a `?` allows at most one match, while replacement with a `+` requires at least one match.
* By default, the loops are greedy (ie, they try and consume the pattern as many times as possible) but they can be made non-greedy (ie, matching the pattern as few times as possible) by appending another `?` after the `*`, `?` or `+`.

#### And Operation `<pattern> <pattern> ...`

* This operation requires that all patterns be sequentially matched starting from the current position.

#### Action `<pattern> {code}`

* Actions specify the code used to evaluate the final value of the matched pattern.
* Like predicates, previously matched labeled data within the current rule is accessible using the label name.
* If `config.lazyeval` is disabled, all the other actions referenced via the labeled data are evaluated before this action.
* If `config.lazyeval` is enabled, it is possible to conditionally evaluate other actions. In this case and the next, functions are provided in place of their return values. The arguments given to these functions can be accessed via the `args` array.
* If `config.async` is also enabled, evaluation of all actions requires providing a `callback` function as the last argument.

#### Or Operation `<pattern> / <pattern> / ...`

* This operation requires that any one of the patterns be matched at the current position.
* The pipe symbol `|` is synonymous with the forward-slash `/` here.

#### Group `( <pattern> )`

* This modifier allows you to combine multiple elements into a single pattern so that high-precendence unary operators (label, lookahead & loop) can applicable for the whole group, instead of just a single element.