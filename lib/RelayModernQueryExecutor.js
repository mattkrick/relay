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

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var RelayError = require("./RelayError");

var RelayInMemoryRecordSource = require("./RelayInMemoryRecordSource");

var RelayModernRecord = require("./RelayModernRecord");

var RelayObservable = require("./RelayObservable");

var RelayResponseNormalizer = require("./RelayResponseNormalizer");

var generateRelayClientID = require("./generateRelayClientID");

var invariant = require("fbjs/lib/invariant");

var _require = require("./RelayStoreUtils"),
    ROOT_TYPE = _require.ROOT_TYPE,
    TYPENAME_KEY = _require.TYPENAME_KEY,
    getStorageKey = _require.getStorageKey;

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
    this._source = new Map();
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

    if (response.data == null) {
      var errors = response.errors;
      var error = RelayError.create('RelayNetwork', 'No data returned for operation `%s`, got error(s):\n%s\n\nSee the error ' + '`source` property for more information.', this._operation.node.params.name, errors ? errors.map(function (_ref2) {
        var message = _ref2.message;
        return message;
      }).join('\n') : '(No errors)');
      error.source = {
        errors: errors,
        operation: this._operation.node,
        variables: this._operation.variables
      };
      throw error;
    } // Above check ensures that response.data != null


    var responseWithData = response;
    var isOptimistic = ((_response$extensions = response.extensions) === null || _response$extensions === void 0 ? void 0 : _response$extensions.isOptimistic) === true;

    if (isOptimistic && this._state !== 'started') {
      !false ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernQueryExecutor: optimistic payload received after server payload.') : invariant(false) : void 0;
    }

    this._state = 'loading';

    if (isOptimistic) {
      this._processOptimisticResponse(responseWithData);
    } else {
      var path = response.path,
          label = response.label;

      if (path != null || label != null) {
        if (typeof label !== 'string' || !Array.isArray(path)) {
          !false ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernQueryExecutor: invalid incremental payload, expected ' + '`path` and `label` to either both be null/undefined, or ' + '`path` to be an `Array<string | number>` and `label` to be a ' + '`string`.') : invariant(false) : void 0;
        } else {
          this._processIncrementalResponse(label, path, responseWithData);
        }
      } else {
        this._processResponse(responseWithData);
      }
    }

    this._sink.next(response);
  };

  _proto._processOptimisticResponse = function _processOptimisticResponse(response) {
    !(this._optimisticUpdate === null) ? process.env.NODE_ENV !== "production" ? invariant(false, 'environment.execute: only support one optimistic response per ' + 'execute.') : invariant(false) : void 0;
    var payload = normalizeResponse(response, this._operation.root, ROOT_TYPE, []
    /* path */
    );
    var incrementalPlaceholders = payload.incrementalPlaceholders,
        moduleImportPayloads = payload.moduleImportPayloads;

    if (incrementalPlaceholders != null && incrementalPlaceholders.length !== 0 || moduleImportPayloads != null && moduleImportPayloads.length !== 0) {
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
        moduleImportPayloads = payload.moduleImportPayloads;

    if (moduleImportPayloads && moduleImportPayloads.length !== 0) {
      var operationLoader = this._operationLoader;
      !operationLoader ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Expected an operationLoader to be ' + 'configured when using `@match`.') : invariant(false) : void 0;
      moduleImportPayloads.forEach(function (moduleImportPayload) {
        _this2._processModuleImportPayload(moduleImportPayload, operationLoader);
      });
    }

    if (incrementalPlaceholders && incrementalPlaceholders.length !== 0) {
      incrementalPlaceholders.forEach(function (incrementalPlaceholder) {
        _this2._processIncrementalPlaceholder(payload, incrementalPlaceholder);
      });
    }
  };
  /**
   * Processes a ModuleImportPayload, asynchronously resolving the normalization
   * AST and using it to normalize the field data into a RelayResponsePayload.
   * The resulting payload may contain other incremental payloads (match,
   * defer, stream, etc); these are handled by calling
   * `_processPayloadFollowups()`.
   */


  _proto._processModuleImportPayload = function _processModuleImportPayload(moduleImportPayload, operationLoader) {
    var _this3 = this;

    var id = this._nextSubscriptionId++; // Observable.from(operationLoader.load()) wouldn't catch synchronous errors
    // thrown by the load function, which is user-defined. Guard against that
    // with Observable.from(new Promise(<work>)).

    RelayObservable.from(new Promise(function (resolve, reject) {
      operationLoader.load(moduleImportPayload.operationReference).then(resolve, reject);
    })).map(function (operation) {
      if (operation == null) {
        return;
      }

      var selector = {
        dataID: moduleImportPayload.dataID,
        variables: moduleImportPayload.variables,
        node: operation
      };
      var relayPayload = normalizeResponse({
        data: moduleImportPayload.data
      }, selector, moduleImportPayload.typeName, moduleImportPayload.path);

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


  _proto._processIncrementalPlaceholder = function _processIncrementalPlaceholder(relayPayload, placeholder) {
    var _relayPayload$fieldPa;

    // Update the label => path => placeholder map
    var kind = placeholder.kind,
        label = placeholder.label,
        path = placeholder.path;
    var pathKey = path.map(String).join('.');

    var dataForLabel = this._incrementalPlaceholders.get(label);

    if (dataForLabel == null) {
      dataForLabel = {
        kind: kind,
        placeholdersByPath: new Map()
      };

      this._incrementalPlaceholders.set(label, dataForLabel);
    } else if (dataForLabel.kind !== kind) {
      !false ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Received inconsistent data for label `%s`, ' + 'expected `@%s` data but got `@%s` data.', label, dataForLabel.kind, kind) : invariant(false) : void 0;
    }

    dataForLabel.placeholdersByPath.set(pathKey, placeholder); // Store references to the parent node to allow detecting concurrent
    // modifications to the parent before items arrive and to replay
    // handle field payloads to account for new information on source records.

    var parentID;

    if (placeholder.kind === 'stream') {
      parentID = placeholder.parentID;
    } else {
      parentID = placeholder.selector.dataID;
    }

    var parentRecord = relayPayload.source.get(parentID);
    var parentPayloads = ((_relayPayload$fieldPa = relayPayload.fieldPayloads) !== null && _relayPayload$fieldPa !== void 0 ? _relayPayload$fieldPa : []).filter(function (fieldPayload) {
      var fieldID = generateRelayClientID(fieldPayload.dataID, fieldPayload.fieldKey);
      return (// handlers applied to the streamed field itself
        fieldPayload.dataID === parentID || // handlers applied to a field on an ancestor object, where
        // ancestor.field links to the parent record (example: connections)
        fieldID === parentID
      );
    }); // null-check is for flow; if an incremental payload exists for some id that
    // record should also exist.

    if (parentRecord != null) {
      this._source.set(parentID, {
        record: parentRecord,
        fieldPayloads: parentPayloads
      });
    }
  };
  /**
   * Lookup the placeholder the describes how to process an incremental
   * response, normalize/publish it, and process any nested defer/match/stream
   * metadata.
   */


  _proto._processIncrementalResponse = function _processIncrementalResponse(label, path, response) {
    var dataForLabel = this._incrementalPlaceholders.get(label);

    !(dataForLabel != null) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Received response for unknown label ' + "'".concat(label, "'. Known labels: ").concat(Array.from(this._incrementalPlaceholders.keys()).join(', '), ".")) : invariant(false) : void 0;

    if (dataForLabel.kind === 'defer') {
      var pathKey = path.map(String).join('.');
      var placeholder = dataForLabel.placeholdersByPath.get(pathKey);
      !(placeholder != null) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Received response for unknown path `%s` ' + 'for label `%s`. Known paths: %s.', pathKey, label, Array.from(dataForLabel.placeholdersByPath.keys()).join(', ')) : invariant(false) : void 0;
      !(placeholder.kind === 'defer') ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Expected data for path `%s` for label `%s` ' + 'to be data for @defer, was `@%s`.', pathKey, label, placeholder.kind) : invariant(false) : void 0;

      this._processDeferResponse(label, path, placeholder, response);
    } else {
      // @stream payload path values end in the field name and item index,
      // but Relay records paths relative to the parent of the stream node:
      // therefore we strip the last two elements just to lookup the path
      // (the item index is used later to insert the element in the list)
      var _pathKey = path.slice(0, -2).map(String).join('.');

      var _placeholder = dataForLabel.placeholdersByPath.get(_pathKey);

      !(_placeholder != null) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Received response for unknown path `%s` ' + 'for label `%s`. Known paths: %s.', _pathKey, label, Array.from(dataForLabel.placeholdersByPath.keys()).join(', ')) : invariant(false) : void 0;
      !(_placeholder.kind === 'stream') ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Expected data for path `%s` for label `%s` ' + 'to be data for @stream, was `@%s`.', _pathKey, label, _placeholder.kind) : invariant(false) : void 0;

      this._processStreamResponse(label, path, _placeholder, response);
    }
  };

  _proto._processDeferResponse = function _processDeferResponse(label, path, placeholder, response) {
    var parentID = placeholder.selector.dataID;
    var relayPayload = normalizeResponse(response, placeholder.selector, placeholder.typeName, placeholder.path);

    this._processPayloadFollowups(relayPayload);

    this._publishQueue.commitRelayPayload(relayPayload); // Load the version of the parent record from which this incremental data
    // was derived


    var parentEntry = this._source.get(parentID);

    !(parentEntry != null) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Expected the parent record `%s` for @defer ' + 'data to exist.', parentID) : invariant(false) : void 0;
    var fieldPayloads = parentEntry.fieldPayloads;

    if (fieldPayloads.length !== 0) {
      var handleFieldsRelayPayload = {
        errors: null,
        fieldPayloads: fieldPayloads,
        incrementalPlaceholders: null,
        moduleImportPayloads: null,
        source: new RelayInMemoryRecordSource()
      };

      this._publishQueue.commitRelayPayload(handleFieldsRelayPayload);
    }

    this._publishQueue.run();
  };
  /**
   * Process the data for one item in a @stream field.
   */


  _proto._processStreamResponse = function _processStreamResponse(label, path, placeholder, response) {
    var _field$alias, _data$id, _field$concreteType;

    var parentID = placeholder.parentID,
        node = placeholder.node,
        variables = placeholder.variables;
    var data = response.data;
    !(typeof data === 'object') ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Expected the GraphQL @stream payload `data` ' + 'value to be an object.') : invariant(false) : void 0; // Find the LinkedField where @stream was applied

    var field = node.selections[0];
    !(field != null && field.kind === 'LinkedField' && field.plural === true) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Expected @stream to be used on a plural field.') : invariant(false) : void 0;
    var responseKey = (_field$alias = field.alias) !== null && _field$alias !== void 0 ? _field$alias : field.name;
    var storageKey = getStorageKey(field, variables); // Load the version of the parent record from which this incremental data
    // was derived

    var parentEntry = this._source.get(parentID);

    !(parentEntry != null) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Expected the parent record `%s` for @stream ' + 'data to exist.', parentID) : invariant(false) : void 0;
    var parentRecord = parentEntry.record,
        fieldPayloads = parentEntry.fieldPayloads; // Load the field value (items) that were created by *this* query executor
    // in order to check if there has been any concurrent modifications by some
    // other operation.

    var prevIDs = RelayModernRecord.getLinkedRecordIDs(parentRecord, storageKey);
    !(prevIDs != null) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Expected record `%s` to have fetched field ' + '`%s` with @stream.', parentID, field.name) : invariant(false) : void 0; // Determine the index in the field of the new item

    var finalPathEntry = path[path.length - 1];
    var itemIndex = parseInt(finalPathEntry, 10);
    !(itemIndex === finalPathEntry && itemIndex >= 0) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Expected path for @stream to end in a ' + 'positive integer index, got `%s`', finalPathEntry) : invariant(false) : void 0; // Determine the __id of the new item: this must equal the value that would
    // be assigned had the item not been streamed

    var itemID = ((_data$id = data.id) !== null && _data$id !== void 0 ? _data$id : prevIDs && prevIDs[itemIndex]) || // Reuse previously generated client IDs
    generateRelayClientID(parentID, storageKey, itemIndex);
    !(typeof itemID === 'string') ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Expected id of elements of field `%s` to ' + 'be strings.', storageKey) : invariant(false) : void 0; // Build a selector to normalize the item data with

    var selector = {
      dataID: itemID,
      node: field,
      variables: variables
    };
    var typeName = (_field$concreteType = field.concreteType) !== null && _field$concreteType !== void 0 ? _field$concreteType : data[TYPENAME_KEY];
    !(typeof typeName === 'string') ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernEnvironment: Expected @stream field `%s` to have a ' + '__typename.', field.name) : invariant(false) : void 0; // Update the cached version of the parent record to reflect the new item:
    // this is used when subsequent stream payloads arrive to see if there
    // have been concurrent modifications to the list

    var nextParentRecord = RelayModernRecord.clone(parentRecord);
    var nextIDs = (0, _toConsumableArray2["default"])(prevIDs);
    nextIDs[itemIndex] = itemID;
    RelayModernRecord.setLinkedRecordIDs(nextParentRecord, storageKey, nextIDs);

    this._source.set(parentID, {
      record: nextParentRecord,
      fieldPayloads: fieldPayloads
    }); // Publish the new item and update the parent record to set
    // field[index] = item *if* the parent record hasn't been concurrently
    // modified.


    var relayPayload = normalizeResponse(response, selector, typeName, (0, _toConsumableArray2["default"])(placeholder.path).concat([responseKey, String(itemIndex)]));

    this._processPayloadFollowups(relayPayload);

    this._publishQueue.commitPayload(this._operation, relayPayload, function (store) {
      var currentParentRecord = store.get(parentID);

      if (currentParentRecord == null) {
        // parent has since been deleted, stream data is stale
        if (process.env.NODE_ENV !== "production") {
          console.warn('RelayModernEnvironment: Received stale @stream payload, parent ' + "record '".concat(parentID, "' no longer exists."));
        }

        return;
      }

      var currentItems = currentParentRecord.getLinkedRecords(storageKey);

      if (currentItems == null) {
        // field has since been deleted, stream data is stale
        if (process.env.NODE_ENV !== "production") {
          console.warn('RelayModernEnvironment: Received stale @stream payload, field ' + "'".concat(field.name, "' on parent record '").concat(parentID, "' no longer exists."));
        }

        return;
      }

      if (currentItems.length !== prevIDs.length || currentItems.some(function (currentItem, index) {
        return prevIDs[index] !== (currentItem && currentItem.getDataID());
      })) {
        // field has been modified by something other than this query,
        // stream data is stale
        if (process.env.NODE_ENV !== "production") {
          console.warn('RelayModernEnvironment: Received stale @stream payload, items for ' + "field '".concat(field.name, "' on parent record '").concat(parentID, "' have changed."));
        }

        return;
      } // parent.field has not been concurrently modified:
      // update `parent.field[index] = item`


      var nextItems = (0, _toConsumableArray2["default"])(currentItems);
      nextItems[itemIndex] = store.get(itemID);
      currentParentRecord.setLinkedRecords(nextItems, storageKey);
    }); // Now that the parent record has been updated to include the new item,
    // also update any handle fields that are derived from the parent record.


    if (fieldPayloads.length !== 0) {
      var handleFieldsRelayPayload = {
        errors: null,
        fieldPayloads: fieldPayloads,
        incrementalPlaceholders: null,
        moduleImportPayloads: null,
        source: new RelayInMemoryRecordSource()
      };

      this._publishQueue.commitRelayPayload(handleFieldsRelayPayload);
    }

    this._publishQueue.run();
  };

  return Executor;
}();

function normalizeResponse(response, selector, typeName, path) {
  var data = response.data,
      errors = response.errors;
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
    moduleImportPayloads: normalizeResult.moduleImportPayloads,
    source: source
  };
}

module.exports = {
  execute: execute
};