/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 * @format
 * @emails oncall+relay
 */
'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var DataChecker = require("./DataChecker");

var RelayCore = require("./RelayCore");

var RelayDefaultHandlerProvider = require("./RelayDefaultHandlerProvider");

var RelayDefaultMissingFieldHandlers = require("./RelayDefaultMissingFieldHandlers");

var RelayModernQueryExecutor = require("./RelayModernQueryExecutor");

var RelayObservable = require("./RelayObservable");

var RelayPublishQueue = require("./RelayPublishQueue");

var RelayRecordSource = require("./RelayRecordSource");

var defaultGetDataID = require("./defaultGetDataID");

var invariant = require("fbjs/lib/invariant");

var normalizeRelayPayload = require("./normalizeRelayPayload");

var warning = require("fbjs/lib/warning");

var RelayModernEnvironment =
/*#__PURE__*/
function () {
  function RelayModernEnvironment(config) {
    var _this = this;

    var _config$UNSTABLE_DO_N, _config$publishQueue, _config$scheduler, _config$missingFieldH;

    this.configName = config.configName;
    var handlerProvider = config.handlerProvider ? config.handlerProvider : RelayDefaultHandlerProvider;
    var operationLoader = config.operationLoader;

    if (process.env.NODE_ENV !== "production") {
      if (operationLoader != null) {
        !(typeof operationLoader === 'object' && typeof operationLoader.get === 'function' && typeof operationLoader.load === 'function') ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Expected `operationLoader` to be an object ' + 'with get() and load() functions, got `%s`.', operationLoader) : invariant(false) : void 0;
      }
    }

    this._operationLoader = operationLoader;
    this._network = config.network;
    this._getDataID = (_config$UNSTABLE_DO_N = config.UNSTABLE_DO_NOT_USE_getDataID) !== null && _config$UNSTABLE_DO_N !== void 0 ? _config$UNSTABLE_DO_N : defaultGetDataID;
    this._publishQueue = (_config$publishQueue = config.publishQueue) !== null && _config$publishQueue !== void 0 ? _config$publishQueue : new RelayPublishQueue(config.store, handlerProvider, this._getDataID);
    this._scheduler = (_config$scheduler = config.scheduler) !== null && _config$scheduler !== void 0 ? _config$scheduler : null;
    this._store = config.store;
    this.unstable_internal = (0, _objectSpread2["default"])({}, RelayCore, {
      getOperationTracker: function getOperationTracker() {
        return _this._operationTracker;
      }
    });

    this.__setNet = function (newNet) {
      return _this._network = newNet;
    };

    if (process.env.NODE_ENV !== "production") {
      var _require = require("./StoreInspector"),
          inspect = _require.inspect;

      this.DEBUG_inspect = function (dataID) {
        return inspect(_this, dataID);
      };
    } // Register this Relay Environment with Relay DevTools if it exists.
    // Note: this must always be the last step in the constructor.


    var _global = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : undefined;

    var devToolsHook = _global && _global.__RELAY_DEVTOOLS_HOOK__;

    if (devToolsHook) {
      devToolsHook.registerEnvironment(this);
    }

    this._missingFieldHandlers = (_config$missingFieldH = config.missingFieldHandlers) !== null && _config$missingFieldH !== void 0 ? _config$missingFieldH : RelayDefaultMissingFieldHandlers;

    if (config.operationTracker != null) {
      this._operationTracker = config.operationTracker;
    }
  }

  var _proto = RelayModernEnvironment.prototype;

  _proto.getStore = function getStore() {
    return this._store;
  };

  _proto.getNetwork = function getNetwork() {
    return this._network;
  };

  _proto.applyUpdate = function applyUpdate(optimisticUpdate) {
    var _this2 = this;

    var dispose = function dispose() {
      _this2._publishQueue.revertUpdate(optimisticUpdate);

      _this2._publishQueue.run();
    };

    this._publishQueue.applyUpdate(optimisticUpdate);

    this._publishQueue.run();

    return {
      dispose: dispose
    };
  };

  _proto.revertUpdate = function revertUpdate(update) {
    this._publishQueue.revertUpdate(update);

    this._publishQueue.run();
  };

  _proto.replaceUpdate = function replaceUpdate(update, newUpdate) {
    this._publishQueue.revertUpdate(update);

    this._publishQueue.applyUpdate(newUpdate);

    this._publishQueue.run();
  };

  _proto.applyMutation = function applyMutation(_ref) {
    var operation = _ref.operation,
        optimisticResponse = _ref.optimisticResponse,
        optimisticUpdater = _ref.optimisticUpdater;
    return this.applyUpdate({
      operation: operation,
      selectorStoreUpdater: optimisticUpdater,
      response: optimisticResponse || null
    });
  };

  _proto.check = function check(readSelector) {
    if (this._missingFieldHandlers == null) {
      return this._store.check(readSelector);
    }

    return this._checkSelectorAndHandleMissingFields(readSelector, this._missingFieldHandlers);
  };

  _proto.commitPayload = function commitPayload(operationDescriptor, payload) {
    // Do not handle stripped nulls when committing a payload
    var relayPayload = normalizeRelayPayload(operationDescriptor.root, payload, null
    /* errors */
    , {
      getDataID: this._getDataID
    });

    this._publishQueue.commitPayload(operationDescriptor, relayPayload);

    this._publishQueue.run();
  };

  _proto.commitUpdate = function commitUpdate(updater) {
    this._publishQueue.commitUpdate(updater);

    this._publishQueue.run();
  };

  _proto.lookup = function lookup(readSelector, owner) {
    return this._store.lookup(readSelector, owner);
  };

  _proto.subscribe = function subscribe(snapshot, callback) {
    return this._store.subscribe(snapshot, callback);
  };

  _proto.retain = function retain(selector) {
    return this._store.retain(selector);
  };

  _proto._checkSelectorAndHandleMissingFields = function _checkSelectorAndHandleMissingFields(selector, handlers) {
    var target = RelayRecordSource.create();
    var result = DataChecker.check(this._store.getSource(), target, selector, handlers, this._operationLoader, this._getDataID);

    if (target.size() > 0) {
      this._publishQueue.commitSource(target);

      this._publishQueue.run();
    }

    return result;
  }
  /**
   * Returns an Observable of GraphQLResponse resulting from executing the
   * provided Query or Subscription operation, each result of which is then
   * normalized and committed to the publish queue.
   *
   * Note: Observables are lazy, so calling this method will do nothing until
   * the result is subscribed to: environment.execute({...}).subscribe({...}).
   */
  ;

  _proto.execute = function execute(_ref2) {
    var _this3 = this;

    var operation = _ref2.operation,
        cacheConfig = _ref2.cacheConfig,
        updater = _ref2.updater;
    return RelayObservable.create(function (sink) {
      var source = _this3._network.execute(operation.node.params, operation.variables, cacheConfig || {});

      var executor = RelayModernQueryExecutor.execute({
        operation: operation,
        operationLoader: _this3._operationLoader,
        optimisticUpdate: null,
        publishQueue: _this3._publishQueue,
        scheduler: _this3._scheduler,
        sink: sink,
        source: source,
        updater: updater,
        operationTracker: _this3._operationTracker,
        getDataID: _this3._getDataID
      });
      return function () {
        return executor.cancel();
      };
    });
  }
  /**
   * Returns an Observable of GraphQLResponse resulting from executing the
   * provided Mutation operation, the result of which is then normalized and
   * committed to the publish queue along with an optional optimistic response
   * or updater.
   *
   * Note: Observables are lazy, so calling this method will do nothing until
   * the result is subscribed to:
   * environment.executeMutation({...}).subscribe({...}).
   */
  ;

  _proto.executeMutation = function executeMutation(_ref3) {
    var _this4 = this;

    var operation = _ref3.operation,
        optimisticResponse = _ref3.optimisticResponse,
        optimisticUpdater = _ref3.optimisticUpdater,
        updater = _ref3.updater,
        uploadables = _ref3.uploadables;
    return RelayObservable.create(function (sink) {
      var optimisticUpdate;

      if (optimisticResponse || optimisticUpdater) {
        var _optimisticResponse;

        optimisticUpdate = {
          operation: operation,
          selectorStoreUpdater: optimisticUpdater,
          response: (_optimisticResponse = optimisticResponse) !== null && _optimisticResponse !== void 0 ? _optimisticResponse : null
        };
      }

      var source = _this4._network.execute(operation.node.params, operation.variables, {
        force: true
      }, uploadables);

      var executor = RelayModernQueryExecutor.execute({
        operation: operation,
        operationLoader: _this4._operationLoader,
        optimisticUpdate: optimisticUpdate,
        publishQueue: _this4._publishQueue,
        scheduler: _this4._scheduler,
        sink: sink,
        source: source,
        updater: updater,
        operationTracker: _this4._operationTracker,
        getDataID: _this4._getDataID
      });
      return function () {
        return executor.cancel();
      };
    });
  }
  /**
   * Returns an Observable of GraphQLResponse resulting from executing the
   * provided Query or Subscription operation responses, the result of which is
   * then normalized and comitted to the publish queue.
   *
   * Note: Observables are lazy, so calling this method will do nothing until
   * the result is subscribed to:
   * environment.executeWithSource({...}).subscribe({...}).
   */
  ;

  _proto.executeWithSource = function executeWithSource(_ref4) {
    var _this5 = this;

    var operation = _ref4.operation,
        source = _ref4.source;
    return RelayObservable.create(function (sink) {
      var executor = RelayModernQueryExecutor.execute({
        operation: operation,
        operationLoader: _this5._operationLoader,
        optimisticUpdate: null,
        publishQueue: _this5._publishQueue,
        scheduler: _this5._scheduler,
        sink: sink,
        source: source,
        getDataID: _this5._getDataID
      });
      return function () {
        return executor.cancel();
      };
    });
  }
  /**
   * @deprecated Use Environment.execute().subscribe()
   */
  ;

  _proto.sendQuery = function sendQuery(_ref5) {
    var cacheConfig = _ref5.cacheConfig,
        onCompleted = _ref5.onCompleted,
        onError = _ref5.onError,
        onNext = _ref5.onNext,
        operation = _ref5.operation;
    process.env.NODE_ENV !== "production" ? warning(false, 'environment.sendQuery() is deprecated. Update to the latest ' + 'version of react-relay, and use environment.execute().') : void 0;
    return this.execute({
      operation: operation,
      cacheConfig: cacheConfig
    }).subscribeLegacy({
      onNext: onNext,
      onError: onError,
      onCompleted: onCompleted
    });
  }
  /**
   * @deprecated Use Environment.executeMutation().subscribe()
   */
  ;

  _proto.sendMutation = function sendMutation(_ref6) {
    var onCompleted = _ref6.onCompleted,
        onError = _ref6.onError,
        operation = _ref6.operation,
        optimisticResponse = _ref6.optimisticResponse,
        optimisticUpdater = _ref6.optimisticUpdater,
        updater = _ref6.updater,
        uploadables = _ref6.uploadables;
    process.env.NODE_ENV !== "production" ? warning(false, 'environment.sendMutation() is deprecated. Update to the latest ' + 'version of react-relay, and use environment.executeMutation().') : void 0;
    return this.executeMutation({
      operation: operation,
      optimisticResponse: optimisticResponse,
      optimisticUpdater: optimisticUpdater,
      updater: updater,
      uploadables: uploadables
    }).subscribeLegacy({
      // NOTE: sendMutation has a non-standard use of onCompleted() by passing
      // it a value. When switching to use executeMutation(), the next()
      // Observer should be used to preserve behavior.
      onNext: function onNext(payload) {
        onCompleted && onCompleted(payload.errors);
      },
      onError: onError,
      onCompleted: onCompleted
    });
  };

  _proto.toJSON = function toJSON() {
    var _this$configName;

    return "RelayModernEnvironment(".concat((_this$configName = this.configName) !== null && _this$configName !== void 0 ? _this$configName : '', ")");
  };

  return RelayModernEnvironment;
}(); // Add a sigil for detection by `isRelayModernEnvironment()` to avoid a
// realm-specific instanceof check, and to aid in module tree-shaking to
// avoid requiring all of RelayRuntime just to detect its environment.


RelayModernEnvironment.prototype['@@RelayModernEnvironment'] = true;
module.exports = RelayModernEnvironment;