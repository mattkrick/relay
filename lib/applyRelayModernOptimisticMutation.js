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

var RelayDeclarativeMutationConfig = require("./RelayDeclarativeMutationConfig");

var invariant = require("fbjs/lib/invariant");

var isRelayModernEnvironment = require("./isRelayModernEnvironment");

/**
 * Higher-level helper function to execute a mutation against a specific
 * environment.
 */
function applyRelayModernOptimisticMutation(environment, config) {
  !isRelayModernEnvironment(environment) ? process.env.NODE_ENV !== "production" ? invariant(false, 'commitRelayModernMutation: expected `environment` to be an instance of ' + '`RelayModernEnvironment`.') : invariant(false) : void 0;
  var _environment$unstable = environment.unstable_internal,
      createOperationDescriptor = _environment$unstable.createOperationDescriptor,
      getRequest = _environment$unstable.getRequest;
  var mutation = getRequest(config.mutation);

  if (mutation.params.operationKind !== 'mutation') {
    throw new Error('commitRelayModernMutation: Expected mutation operation');
  }

  var optimisticUpdater = config.optimisticUpdater;
  var configs = config.configs,
      optimisticResponse = config.optimisticResponse,
      variables = config.variables;
  var operation = createOperationDescriptor(mutation, variables);

  if (configs) {
    var _RelayDeclarativeMuta = RelayDeclarativeMutationConfig.convert(configs, mutation, optimisticUpdater);

    optimisticUpdater = _RelayDeclarativeMuta.optimisticUpdater;
  }

  return environment.applyUpdate({
    operation: operation,
    selectorStoreUpdater: optimisticUpdater,
    response: optimisticResponse
  });
}

module.exports = applyRelayModernOptimisticMutation;