/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 * @format
 */
'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var invariant = require("fbjs/lib/invariant");

/**
 * Determines the variables that are in scope for a fragment given the variables
 * in scope at the root query as well as any arguments applied at the fragment
 * spread via `@arguments`.
 *
 * Note that this is analagous to determining function arguments given a function call.
 */
function getFragmentVariables(fragment, rootVariables, argumentVariables) {
  var variables;
  fragment.argumentDefinitions.forEach(function (definition) {
    if (argumentVariables.hasOwnProperty(definition.name)) {
      return;
    }

    variables = variables || (0, _objectSpread2["default"])({}, argumentVariables);

    switch (definition.kind) {
      case 'LocalArgument':
        variables[definition.name] = definition.defaultValue;
        break;

      case 'RootArgument':
        if (!rootVariables.hasOwnProperty(definition.name)) {
          /*
           * A temporary fix to mute false alarm in cases where the root argument is stripped
           * off by the compiler due to a conditional directive, we do not need this argument
           * when tryiny to read the data from the store.
           */
          break;
        }

        variables[definition.name] = rootVariables[definition.name];
        break;

      default:
        !false ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayConcreteVariables: Unexpected node kind `%s` in fragment `%s`.', definition.kind, fragment.name) : invariant(false) : void 0;
    }
  });
  return variables || argumentVariables;
}
/**
 * Determines the variables that are in scope for a given operation given values
 * for some/all of its arguments. Extraneous input variables are filtered from
 * the output, and missing variables are set to default values (if given in the
 * operation's definition).
 */


function getOperationVariables(operation, variables) {
  var operationVariables = {};
  operation.argumentDefinitions.forEach(function (def) {
    var value = def.defaultValue;

    if (variables[def.name] != null) {
      value = variables[def.name];
    }

    operationVariables[def.name] = value;
  });
  return operationVariables;
}

module.exports = {
  getFragmentVariables: getFragmentVariables,
  getOperationVariables: getOperationVariables
};