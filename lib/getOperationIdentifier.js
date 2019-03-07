/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *  strict-local
 * @format
 */
'use strict';

var invariant = require("fbjs/lib/invariant");

var stableCopy = require("./stableCopy");

/**
 * Returns a stable identifier for a query OperationDescriptor,
 * i.e. for the operation (query) + the variables being used.
 */
function getOperationIdentifier(operation) {
  var node = operation.node,
      variables = operation.variables;
  var requestID = node.params.id != null ? node.params.id : node.params.text;
  !(requestID != null) ? process.env.NODE_ENV !== "production" ? invariant(false, 'getOperationIdentifier: Expected operation `%s` to have either a valid `id` or ' + '`text` property', node.params.name) : invariant(false) : void 0;
  return requestID + JSON.stringify(stableCopy(variables));
}

module.exports = getOperationIdentifier;