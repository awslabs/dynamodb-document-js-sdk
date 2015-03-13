"use strict";

/**
 * Creates an instance of Condition that is used by the DynamoDB Document client.
 *
 * @param {string} key The attribute name being conditioned on.
 * @param {string} operator The operator in the conditional clause. (See aws sdk docs for full list of operators)
 * @param val<n> Potential <n>nd element in what would be the AttributeValueList (optional)
 * @return {Condition} Condition for your DynamoDB request.
 */
function DynamoDBCondition(key, operator) { /* and variable arguments. */
    var datatypes = typeof(window) === "undefined" ? require("./datatypes").DynamoDBDatatype
                : window.DynamoDBDatatype;

    var t = new datatypes();

    var args = Array.prototype.slice.call(arguments, 2);

    var CondObj = function Condition(key, operator, args) {
            this.key = key;
            this.operator = operator;
            this.args = args;

            // for comatibility
            this.val1 = args[0];
            this.val2 = args[1];

            this.format = function() {
                var formatted = {};
                var attrValueList = [];

                for (var i=0; i<this.args.length; i++) {
                    if (this.args[i] !== undefined) {
                        attrValueList.push(t.formatDataType(this.args[i]));
                    }
                }
                if (attrValueList.length > 0) {
                    formatted.AttributeValueList = attrValueList;
                }
                formatted.ComparisonOperator = this.operator;

                return formatted;
            };
    };

    var cond = new CondObj(key, operator, args);
    cond.prototype = Object.create(Object.prototype);
    cond.prototype.instanceOf  = "DynamoDBConditionObject";

    return cond;
}

if (typeof(module) !== "undefined") {
    var exports = module.exports = {};
    exports.DynamoDBCondition = DynamoDBCondition;
}
