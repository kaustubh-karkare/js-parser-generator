
## JSPG: Parser Configuration Options

The Parser Constructor takes the following arguments:
* `grammar`: A string containing the Parsing Expression Grammar.
* `config` [optional]: An object specifying the details of the parsing & evaluation process.

The config object recognizes the following keys:

### start (array-of-strings)

* A list of names of grammar rules, any one of which may be used to start the matching process.
* If not specified, the first rule in the grammar file is considered the starting rule.

### partial (boolean)

* The input data may or may not need to be fully consumed in the matching process.
* The default setting (false) prevents incomplete consumption of input data.

### unwrap (boolean)

* During the matching process, anticipating that multiple patterns may be given the same label, an array corresponding to each label name is maintained for every rule and made available to its predicates & actions.
* In case of arrays with zero or one elements, this can be inconvenient. Replacing the arrays with a null value or the only element can significantly simplify code.
* The default setting (false) does not remove the array-wrapper where possible before providing the data to predicates & actions.

### lazyeval (boolean)

* If disabled, all references in the labeled data to other actions (corresponding to sub-patterns) are evaluated before being provided to the current action.
* This option can be enabled in case evaluation of those other actions is conditional or delayed and can be done lazily (ie, as and when required).

### async (boolean)

* This option requires `config.lazyeval` to be enabled to have any effect.
* It is a special case of lazy-evaluation, in which each function corresponding to an action must be called with the last argument as the callback function.
* This last argument is automatically popped from the `args` array and named `callback`. It's absence will result in an Error being thrown.