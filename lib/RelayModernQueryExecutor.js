/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *  strict-local
 * @format
 * @emails oncall+relay
 */
'use strict';

var RelayError = require("./RelayError");

var RelayInMemoryRecordSource = require("./RelayInMemoryRecordSource");

var RelayModernRecord = require("./RelayModernRecord");

var RelayObservable = require("./RelayObservable");

var RelayPublishQueue = require("./RelayPublishQueue");

var RelayResponseNormalizer = require("./RelayResponseNormalizer");

var invariant = require("fbjs/lib/invariant");

var _require = require("./RelayStoreUtils"),
    ROOT_TYPE = _require.ROOT_TYPE;

function execute(config) {
  return new Executor(config);
}
/**
 * Coordinates the execution of a query, handling network callbacks
 * including optimistic payloads, standard payloads, resolution of match
 * dependencies, etc.
 */


var Executor =
/*#__PURE__*/
function () {
  function Executor(_ref) {
    var _this = this;

    var _optimisticUpdate;

    var operation = _ref.operation,
        operationLoader = _ref.operationLoader,
        optimisticUpdate = _ref.optimisticUpdate,
        publishQueue = _ref.publishQueue,
        sink = _ref.sink,
        source = _ref.source,
        updater = _ref.updater;
    this._incrementalPlaceholders = new Map();
    this._nextSubscriptionId = 0;
    this._operation = operation;
    this._operationLoader = operationLoader;
    this._optimisticUpdate = (_optimisticUpdate = optimisticUpdate) !== null && _optimisticUpdate !== void 0 ? _optimisticUpdate : null;
    this._publishQueue = publishQueue;
    this._sink = sink;
    this._state = 'started';
    this._updater = updater;
    this._subscriptions = new Map();
    var id = this._nextSubscriptionId++;
    source.subscribe({
      complete: function complete() {
        return _this._complete(id);
      },
      error: function error(_error2) {
        return _this._error(id, _error2);
      },
      next: function next(response) {
        try {
          _this._next(id, response);
        } catch (error) {
          sink.error(error);
        }
      },
      start: function start(subscription) {
        return _this._start(id, subscription);
      }
    });

    if (optimisticUpdate != null) {
      publishQueue.applyUpdate(optimisticUpdate);
      publishQueue.run();
    }
  } // Cancel any pending execution tasks and mark the executor as completed.


  var _proto = Executor.prototype;

  _proto.cancel = function cancel() {
    if (this._state === 'completed') {
      return;
    }

    this._state = 'completed';

    if (this._subscriptions.size !== 0) {
      this._subscriptions.forEach(function (sub) {
        return sub.unsubscribe();
      });

      this._subscriptions.clear();
    }

    var optimisticResponse = this._optimisticUpdate;

    if (optimisticResponse !== null) {
      this._optimisticUpdate = null;

      this._publishQueue.revertUpdate(optimisticResponse);

      this._publishQueue.run();
    }

    this._incrementalPlaceholders.clear();
  };

  _proto._complete = function _complete(id) {
    this._subscriptions["delete"](id);

    if (this._subscriptions.size === 0) {
      this.cancel();

      this._sink.complete();
    }
  };

  _proto._error = function _error(_id, error) {
    this.cancel();

    this._sink.error(error);
  };

  _proto._start = function _start(id, subscription) {
    this._subscriptions.set(id, subscription);
  }; // Handle a raw GraphQL response.


  _proto._next = function _next(_id, response) {
    var _response$extensions;

    if (this._state === 'completed') {
      if (process.env.NODE_ENV !== "production") {
        console.warn('RelayModernQueryExecutor: payload received after execution ' + "completed: '".concat(JSON.stringify(response), "'"));
      }

      return;
    }

    var isOptimistic = ((_response$extensions = response.extensions) === null || _response$extensions === void 0 ? void 0 : _response$extensions.isOptimistic) === true;

    if (isOptimistic && this._state !== 'started') {
      !false ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernQueryExecutor: optimistic payload received after server payload.') : invariant(false) : void 0;
    }

    this._state = 'loading';

    if (isOptimistic) {
      this._processOptimisticResponse(response);
    } else {
      var path = response.path,
          label = response.label;

      if (path != null || label != null) {
        if (typeof label !== 'string' || !Array.isArray(path)) {
          !false ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernQueryExecutor: invalid incremental payload, expected ' + '`path` and `label` to either both be null/undefined, or ' + '`path` to be an `Array<string | number>` and `label` to be a ' + '`string`.') : invariant(false) : void 0;
        } else {
          this._processIncrementalResponse(label, path, response);
        }
      } else {
        this._processResponse(response);
      }
    }

    this._sink.next(response);
  };

  _proto._processOptimisticResponse = function _processOptimisticResponse(response) {
    !(this._optimisticUpdate === null) ? process.env.NODE_ENV !== "production" ? invariant(false, 'environment.execute: only support one optimistic response per ' + 'execute.') : invariant(false) : void 0;

    var payload = this._normalizeResponse(response, this._operation.root, ROOT_TYPE, []
    /* path */
    );

    var incrementalPlaceholders = payload.incrementalPlaceholders,
        matchPayloads = payload.matchPayloads;

    if (incrementalPlaceholders != null && incrementalPlaceholders.length !== 0 || matchPayloads != null && matchPayloads.length !== 0) {
      !false ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernQueryExecutor: optimistic responses cannot be returned ' + 'for operations that use incremental data delivery (@match, ' + '@defer, and @stream).') : invariant(false) : void 0;
    }

    this._optimisticUpdate = {
      source: payload.source,
      fieldPayloads: payload.fieldPayloads
    };

    this._publishQueue.applyUpdate(this._optimisticUpdate);

    this._publishQueue.run();
  };

  _proto._processResponse = function _processResponse(response) {
    var payload = normalizeResponse(response, this._operation.root, ROOT_TYPE, []
    /* path */
    );

    this._incrementalPlaceholders.clear();

    this._source.clear();

    this._processPayloadFollowups(payload);

    this._publishQueue.commitPayload(this._operation, payload, this._updater, this._optimisticUpdate);

    this._optimisticUpdate = null;

    this._publishQueue.run();
  };
  /**
   * Handles any follow-up actions for a Relay payload for @match, @defer,
   * and (in the future) @stream directives.
   */


  _proto._processPayloadFollowups = function _processPayloadFollowups(payload) {
    var _this2 = this;

    var incrementalPlaceholders = payload.incrementalPlaceholders,
        matchPayloads = payload.matchPayloads;

    if (matchPayloads && matchPayloads.length !== 0) {
      var operationLoader = this._operationLoader;
      !operationLoader ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Expected an operationLoader to be ' + 'configured when using `@match`.') : invariant(false) : void 0;
      matchPayloads.forEach(function (matchPayload) {
        _this2._processMatchPayload(matchPayload, operationLoader);
      });
    }

    if (incrementalPlaceholders && incrementalPlaceholders.length !== 0) {
      incrementalPlaceholders.forEach(function (incrementalPlaceholder) {
        _this2._processIncrementalPlaceholder(incrementalPlaceholder);
      });
    }
  };
  /**
   * Processes a MatchFieldPayload, asynchronously resolving the normalization
   * AST and using it to normalize the field data into a RelayResponsePayload.
   * The resulting payload may contain other incremental payloads (match,
   * defer, stream, etc); these are handled by calling
   * `_processPayloadFollowups()`.
   */


  _proto._processMatchPayload = function _processMatchPayload(matchPayload, operationLoader) {
    var _this3 = this;

    var id = this._nextSubscriptionId++; // Observable.from(operationLoader.load()) wouldn't catch synchronous errors
    // thrown by the load function, which is user-defined. Guard against that
    // with Observable.from(new Promise(<work>)).

    RelayObservable.from(new Promise(function (resolve, reject) {
      operationLoader.load(matchPayload.operationReference).then(resolve, reject);
    })).map(function (operation) {
      if (operation == null) {
        return;
      }

      var selector = {
        dataID: matchPayload.dataID,
        variables: matchPayload.variables,
        node: operation
      };

      var relayPayload = _this3._normalizeResponse({
        data: matchPayload.data
      }, selector, matchPayload.typeName, matchPayload.path);

      _this3._processPayloadFollowups(relayPayload);

      _this3._publishQueue.commitRelayPayload(relayPayload);

      _this3._publishQueue.run();
    }).subscribe({
      complete: function complete() {
        return _this3._complete(id);
      },
      error: function error(_error3) {
        return _this3._error(id, _error3);
      },
      start: function start(subscription) {
        return _this3._start(id, subscription);
      }
    });
  };
  /**
   * Stores a mapping of label => path => placeholder; at this point the
   * executor knows *how* to process the incremental data and has to save
   * this until the data is available. The placeholder contains the
   * normalization selector, path (for nested defer/stream), and other metadata
   * used to normalize the incremental response.
   */


  _proto._processIncrementalPlaceholder = function _processIncrementalPlaceholder(payload) {
    var label = payload.label,
        path = payload.path;
    var pathKey = path.map(String).join('.');

    var dataForLabel = this._incrementalPlaceholders.get(label);

    if (dataForLabel == null) {
      dataForLabel = new Map();

      this._incrementalPlaceholders.set(label, dataForLabel);
    }

    dataForLabel.set(pathKey, payload);
  };
  /**
   * Lookup the placeholder the describes how to process an incremental
   * response, normalize/publish it, and process any nested defer/match/stream
   * metadata.
   */


  _proto._processIncrementalResponse = function _processIncrementalResponse(label, path, response) {
    var pathKey = path.map(String).join('.');

    var dataForLabel = this._incrementalPlaceholders.get(label);

    if (dataForLabel == null) {
      !false ? process.env.NODE_ENV !== "production" ? invariant(false, "RelayModernEnvironment: Received response for unknown label '".concat(label, "'. Known labels: ").concat(Array.from(this._incrementalPlaceholders.keys()).join(', '), ".")) : invariant(false) : void 0;
    }

    var dataForPath = dataForLabel.get(pathKey);

    if (dataForPath == null) {
      !false ? process.env.NODE_ENV !== "production" ? invariant(false, "RelayModernEnvironment: Received response for unknown path '".concat(pathKey, "' for label '").concat(label, "'. Known paths: ").concat(Array.from(dataForLabel.keys()).join(', '), ".")) : invariant(false) : void 0;
    }

    var relayPayload = this._normalizeResponse(response, dataForPath.selector, dataForPath.typeName, dataForPath.path);

    this._processPayloadFollowups(relayPayload);

    this._publishQueue.commitRelayPayload(relayPayload);

    this._publishQueue.run();
  };

  _proto._normalizeResponse = function _normalizeResponse(response, selector, typeName, path) {
    var data = response.data,
        errors = response.errors;

    if (data == null) {
      var error = RelayError.create('RelayNetwork', 'No data returned for operation `%s`, got error(s):\n%s\n\nSee the error ' + '`source` property for more information.', this._operation.node.params.name, errors ? errors.map(function (_ref2) {
        var message = _ref2.message;
        return message;
      }).join('\n') : '(No errors)');
      error.source = {
        errors: errors,
        operation: selector.node,
        variables: selector.variables
      };
      throw error;
    }

    var source = new RelayInMemoryRecordSource();
    var record = RelayModernRecord.create(selector.dataID, typeName);
    source.set(selector.dataID, record);
    var normalizeResult = RelayResponseNormalizer.normalize(source, selector, data, {
      handleStrippedNulls: true,
      path: path
    });
    return {
      errors: errors,
      incrementalPlaceholders: normalizeResult.incrementalPlaceholders,
      fieldPayloads: normalizeResult.fieldPayloads,
      matchPayloads: normalizeResult.matchPayloads,
      source: source
    };
  };

  return Executor;
}();

module.exports = {
  execute: execute
};