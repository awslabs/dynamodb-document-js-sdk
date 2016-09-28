# DynamoDB Document SDK

**NOTE:** As of September 10, 2015, this version of the Document SDK will be deprecated in favor of the [AWS.DynamoDB.DocumentClient][1] in the [official AWS SDK for JavaScript][2].  This repository will continued to be hosted, but not maintained outside of bug reports.  In addition, discussion and request for guidance should be directed at the [official AWS SDK for JavaScript][2].  Here's how you can get started with [the new client!][3]

***

This SDK abstracts away the typing of attribute values in the low level SDK in order to provide a simpler developing experience.
JS datatypes like `string` or `number` can be passed directly into DynamoDB requests and the wrapping will be handled for you; similarly for responses, datatypes will be unwrapped.

For those DynamoDB types that do not have direct mappings to JS datatypes, a wrapper Object is provided to handle type ambiguities (i.e. StrSet, NumSet, BinSet).

Lastly, a Condition Object is being introduced to simplify the use of the KeyCondition and Expected portion of the request params.
Note: Condition Object serves to simplify previous api (NOT new expressions)

## Getting Started

### Install
```sh
$ npm install dynamodb-doc --save
```

In order to instantiate the client, you still need the [AWS JS SDK](https://github.com/aws/aws-sdk-js) to store your region/credentials.

``` javascript
var AWS = require("aws-sdk");
var DOC = require("dynamodb-doc");

AWS.config.update({region: "us-west-1"});

var docClient = new DOC.DynamoDB();
```

Alternatively if you already have the existing DynamoDB Client, you can pass it in order to instantiate the client.

``` javascript
// assumes AWS.config is set up already
var awsClient = AWS.DynamoDB();
var docClient = new DOC.DynamoDB(awsClient);
```

After this, you can make requests and receive responses with JS datatypes!

JS datatypes that can be used in place of DynamoDB Datatypes:

|Javascript|  DynamoDB  |
|:--------:|:----------:|
|string    |     S      |
|number    |     N      |
|boolean   |     BOOL   |
|null      |     NULL   |
|array     |     L      |
|object    |     M      |


For Sets, the client will provide object for you:

``` javascript
docClient.Set(["a", "b", "c"], "S")
```

Refer to the *Basic Usage* and *Nested DataTypes and More* sections down below to see examples of the updated API.

In addition, the SDK also introduces a special kind of Object in order to simplify conditions.

``` javascript
docClient.Condition(key, operator, val1, val2)
```

Refer to the section down below on *Condition Objects* to see an example of the usage.

**NOTE:** To build the node js files for the browser yourself, run

``` bash
npm install; uglifyjs lib/* | sed 's/\"use strict\";//' > dynamodb-doc.min.js
# sed portion is optional depending on your use case
```

For each example assume we have these variables available to us.

``` javascript
// Basic Client creation
AWS.config.update({ /* ...your config... */ });
docClient = new DOC.DynamoDB();

// Basic Callback
var pfunc = function(err, data) { 
    if (err) {
        console.log(err, err.stack);
    } else {
        console.log(data);
    }
}
```

## Basic Usage:

``` javascript
// Basic Scalar Datatypes
var params = {};
params.TableName = "Users";
params.Item = {UserId : "John",
               Age    : 21,
               Pic    : docClient.StrToBin("someURI")};

docClient.putItem(params, pfunc);

params = {};
params.TableName = "Users";
params.Key = {UserId : "John"}

docClient.getItem(params, pfunc); 

/* Response
{Item: {UserId : "John",
       Age     : 21,
       Pic     : Bin}} 
*/
```

**NOTE:** StrToBin returns either a `Buffer` for NodeJS or `Uint8Array` for the browser.

## Nested DataTypes and More:

``` javascript
var params = {};
params.TableName = "Shopping Cart";

// Compatible is a Map of Part to List of PartId's
// OnSale is a BOOL type
// Discount is a NULL type
params.Item = {PartId       : "CPU1",
               OnSale       : false,
               Discount     : null,
               Compatible   : {Motherboards : ["MB1", "MB2"],
                               RAM          : ["RAM1"]}};

docClient.putItem(params, pfunc);

params = {};
params.Key = {PartId : "CPU1"};
params.TableName = "Shopping Cart";

docClient.getItem(params, pfunc);

/*Response
{Item: {PartId : "CPU1",
        OnSale : false,
        Discount : null,
        Compatible : {Motherboards : ["MB1", "MB2"],
                      RAM          : ["RAM1"]}}};
*/
```

## Condition Object:

``` javascript
var params = {};
params.TableName = "Houses";

// Note: This is a query on the Key Schema of the table.  
// For queries on secondary indexes, specify params.IndexName = "index-name"

// use an array of Condition Objects for multiple conditions
params.KeyConditions = [docClient.Condition("HouseId", "NOT_NULL"),
                        docClient.Condition("YearBuilt", "GT", 2000)];

// use a Condition Object for just a single condition
params.QueryFilter = docClient.Condition("Price", "BETWEEN", 0, 900000);

docClient.query(params, pfunc);

/*Reponse
{Count: 3,
Items: [ { HouseId   : "123 amzn way",
           YearBuilt : 2001,
           Price     : 450000},
         { HouseId   : "321 dynamo st",
           YearBuilt : 2012,
           Price     : 100000},
         { HouseId   : "213 JS ave",
           YearBuilt : 2014,
           Price     : 1}],
ScannedCount: 3}
*/
```

## BacthWriteItem:

```javascript
var params = {
    RequestItems: {
        Table: [{
            PutRequest: {
                Item: { 
                    HouseId   : "123 amzn way",
                    YearBuilt : 2001,
                    Price     : 450000
                }
            },
            DeleteRequest: {
                Key: {     
                    YearBuilt : 2001,
                }
            }
        }],
        Table2: [{
            PutRequest: {
                Item: { 
                    Since   : 2002,
                    Location : "Brazil"
                }
            },
            DeleteRequest: {
                Key: {     
                    Since : 2005,
                }
            }
        }],
    },
    ReturnConsumedCapacity: 'INDEXES | TOTAL | NONE',
    ReturnItemCollectionMetrics: 'SIZE | NONE'
};

docClient.batchWriteItem(params, callback);
```

## Expressions (NEW!!):

``` javascript
var params = {};
params.TableName = "SomeTable";
params.Key = {Some : "Key"};
    
// Use the #(variable) to substitute in place of attribute Names
// Use the :(variable) to subsitute in place of attribute Values
params.UpdateExpression = "set #a = :x + :y";
params.ConditionExpression = "#a < :MAX and Price = :correct";
params.ExpressionAttributeNames = {"#a" : "Description"};
params.ExpressionAttributeValues = {":x" : 20,
                                    ":y" : 45,
                                    ":MAX" : 100,
                                    ":correct" : "is right!!"};

docClient.updateItem(params, pfunc);
```
[1]: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html
[2]: https://github.com/aws/aws-sdk-js
[3]: http://blogs.aws.amazon.com/javascript/post/Tx1OVH5LUZAFC6T/Announcing-the-Amazon-DynamoDB-Document-Client-in-the-AWS-SDK-for-JavaScript
