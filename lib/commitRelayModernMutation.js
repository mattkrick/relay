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

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var RelayDeclarativeMutationConfig = require("./RelayDeclarativeMutationConfig");

var invariant = require("fbjs/lib/invariant");

var isRelayModernEnvironment = require("./isRelayModernEnvironment");

var validateMutation = require("./validateMutation");

var warning = require("fbjs/lib/warning");

/**
 * Higher-level helper function to execute a mutation against a specific
 * environment.
 */
function commitRelayModernMutation(environment, config) {
  !isRelayModernEnvironment(environment) ? process.env.NODE_ENV !== "production" ? invariant(false, 'commitRelayModernMutation: expected `environment` to be an instance of ' + '`RelayModernEnvironment`.') : invariant(false) : void 0;
  var _environment$unstable = environment.unstable_internal,
      createOperationDescriptor = _environment$unstable.createOperationDescriptor,
      getRequest = _environment$unstable.getRequest;
  var mutation = getRequest(config.mutation);

  if (mutation.params.operationKind !== 'mutation') {
    throw new Error('commitRelayModernMutation: Expected mutation operation');
  }

  if (mutation.kind !== 'Request') {
    throw new Error('commitRelayModernMutation: Expected mutation to be of type request');
  }

  var optimisticResponse = config.optimisticResponse,
      optimisticUpdater = config.optimisticUpdater,
      updater = config.updater;
  var configs = config.configs,
      onError = config.onError,
      variables = config.variables,
      uploadables = config.uploadables;
  var operation = createOperationDescriptor(mutation, variables); // TODO: remove this check after we fix flow.

  if (typeof optimisticResponse === 'function') {
    optimisticResponse = optimisticResponse();
    process.env.NODE_ENV !== "production" ? warning(false, 'commitRelayModernMutation: Expected `optimisticResponse` to be an object, ' + 'received a function.') : void 0;
  }

  if (process.env.NODE_ENV !== "production") {
    if (optimisticResponse instanceof Object) {
      validateMutation(optimisticResponse, mutation, config.variables);
    }
  }

  if (configs) {
    var _RelayDeclarativeMuta = RelayDeclarativeMutationConfig.convert(configs, mutation, optimisticUpdater, updater);

    optimisticUpdater = _RelayDeclarativeMuta.optimisticUpdater;
    updater = _RelayDeclarativeMuta.updater;
  }

  var errors = [];
  var subscription = environment.executeMutation({
    operation: operation,
    optimisticResponse: optimisticResponse,
    optimisticUpdater: optimisticUpdater,
    updater: updater,
    uploadables: uploadables
  }).subscribe({
    next: function next(payload) {
      if (payload.errors) {
        errors.push.apply(errors, (0, _toConsumableArray2["default"])(payload.errors));
      }
    },
    complete: function complete() {
      var onCompleted = config.onCompleted;

      if (onCompleted) {
        var snapshot = environment.lookup(operation.fragment, operation);
        onCompleted(snapshot.data, errors.length !== 0 ? errors : null);
      }
    },
    error: onError
  });
  return {
    dispose: subscription.unsubscribe
  };
}

module.exports = commitRelayModernMutation;