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

var DataChecker = require('./DataChecker');

var RelayFeatureFlags = require('../util/RelayFeatureFlags');

var RelayModernRecord = require('./RelayModernRecord');

var RelayOptimisticRecordSource = require('./RelayOptimisticRecordSource');

var RelayProfiler = require('../util/RelayProfiler');

var RelayReader = require('./RelayReader');

var RelayReferenceMarker = require('./RelayReferenceMarker');

var deepFreeze = require('../util/deepFreeze');

var defaultGetDataID = require('./defaultGetDataID');

var hasOverlappingIDs = require('./hasOverlappingIDs');

var invariant = require("fbjs/lib/invariant");

var recycleNodesInto = require('../util/recycleNodesInto');

var resolveImmediate = require('../util/resolveImmediate');

var _require = require('./RelayModernSelector'),
    createReaderSelector = _require.createReaderSelector;

var DEFAULT_RELEASE_BUFFER_SIZE = 0;
/**
 * @public
 *
 * An implementation of the `Store` interface defined in `RelayStoreTypes`.
 *
 * Note that a Store takes ownership of all records provided to it: other
 * objects may continue to hold a reference to such records but may not mutate
 * them. The static Relay core is architected to avoid mutating records that may have been
 * passed to a store: operations that mutate records will either create fresh
 * records or clone existing records and modify the clones. Record immutability
 * is also enforced in development mode by freezing all records passed to a store.
 */

var RelayModernStore =
/*#__PURE__*/
function () {
  function RelayModernStore(source, options) {
    var _ref, _ref2, _ref3, _ref4;

    // Prevent mutation of a record from outside the store.
    if (process.env.NODE_ENV !== "production") {
      var storeIDs = source.getRecordIDs();

      for (var ii = 0; ii < storeIDs.length; ii++) {
        var record = source.get(storeIDs[ii]);

        if (record) {
          RelayModernRecord.freeze(record);
        }
      }
    }

    this._connectionEvents = new Map();
    this._connectionSubscriptions = new Map();
    this._gcHoldCounter = 0;
    this._gcReleaseBufferSize = (_ref = options === null || options === void 0 ? void 0 : options.gcReleaseBufferSize) !== null && _ref !== void 0 ? _ref : DEFAULT_RELEASE_BUFFER_SIZE;
    this._gcScheduler = (_ref2 = options === null || options === void 0 ? void 0 : options.gcScheduler) !== null && _ref2 !== void 0 ? _ref2 : resolveImmediate;
    this._getDataID = (_ref3 = options === null || options === void 0 ? void 0 : options.UNSTABLE_DO_NOT_USE_getDataID) !== null && _ref3 !== void 0 ? _ref3 : defaultGetDataID;
    this._hasScheduledGC = false;
    this._index = 0;
    this._operationLoader = (_ref4 = options === null || options === void 0 ? void 0 : options.operationLoader) !== null && _ref4 !== void 0 ? _ref4 : null;
    this._optimisticSource = null;
    this._recordSource = source;
    this._releaseBuffer = [];
    this._roots = new Map();
    this._shouldScheduleGC = false;
    this._subscriptions = new Set();
    this._updatedConnectionIDs = {};
    this._updatedRecordIDs = {};
  }

  var _proto = RelayModernStore.prototype;

  _proto.getSource = function getSource() {
    var _this$_optimisticSour;

    return (_this$_optimisticSour = this._optimisticSource) !== null && _this$_optimisticSour !== void 0 ? _this$_optimisticSour : this._recordSource;
  };

  _proto.getConnectionEvents_UNSTABLE = function getConnectionEvents_UNSTABLE(connectionID) {
    var events = this._connectionEvents.get(connectionID);

    if (events != null) {
      var _events$optimistic;

      return (_events$optimistic = events.optimistic) !== null && _events$optimistic !== void 0 ? _events$optimistic : events["final"];
    }
  };

  _proto.check = function check(selector) {
    var _this = this;

    var _this$_optimisticSour2;

    var source = (_this$_optimisticSour2 = this._optimisticSource) !== null && _this$_optimisticSour2 !== void 0 ? _this$_optimisticSour2 : this._recordSource;
    return DataChecker.check(source, source, selector, [], this._operationLoader, this._getDataID, function (id) {
      return _this.getConnectionEvents_UNSTABLE(id);
    });
  };

  _proto.retain = function retain(selector) {
    var _this2 = this;

    var index = this._index++;

    var dispose = function dispose() {
      // When disposing, move the selector onto the release buffer
      _this2._releaseBuffer.push(index); // Only when the release buffer is full do we actually
      // release the selector and run GC


      if (_this2._releaseBuffer.length > _this2._gcReleaseBufferSize) {
        var idx = _this2._releaseBuffer.shift();

        _this2._roots["delete"](idx);

        _this2._scheduleGC();
      }
    };

    this._roots.set(index, selector);

    return {
      dispose: dispose
    };
  };

  _proto.lookup = function lookup(selector) {
    var source = this.getSource();
    var snapshot = RelayReader.read(source, selector);

    if (process.env.NODE_ENV !== "production") {
      deepFreeze(snapshot);
    }

    return snapshot;
  } // This method will return a list of updated owners form the subscriptions
  ;

  _proto.notify = function notify() {
    var _this3 = this;

    var source = this.getSource();
    var updatedOwners = [];

    this._subscriptions.forEach(function (subscription) {
      var owner = _this3._updateSubscription(source, subscription);

      if (owner != null) {
        updatedOwners.push(owner);
      }
    });

    this._connectionSubscriptions.forEach(function (subscription, id) {
      if (subscription.stale) {
        subscription.stale = false;
        subscription.callback(subscription.snapshot);
      }
    });

    this._updatedConnectionIDs = {};
    this._updatedRecordIDs = {};
    return updatedOwners;
  };

  _proto.publish = function publish(source) {
    var _this4 = this;

    var _this$_optimisticSour3;

    var target = (_this$_optimisticSour3 = this._optimisticSource) !== null && _this$_optimisticSour3 !== void 0 ? _this$_optimisticSour3 : this._recordSource;
    updateTargetFromSource(target, source, this._updatedRecordIDs);

    this._connectionSubscriptions.forEach(function (subscription, id) {
      var hasStoreUpdates = hasOverlappingIDs(subscription.snapshot.seenRecords, _this4._updatedRecordIDs);

      if (!hasStoreUpdates) {
        return;
      }

      var nextSnapshot = _this4._updateConnection_UNSTABLE(subscription.resolver, subscription.snapshot, source, null);

      if (nextSnapshot) {
        subscription.snapshot = nextSnapshot;
        subscription.stale = true;
      }
    });
  };

  _proto.subscribe = function subscribe(snapshot, callback) {
    var _this5 = this;

    var subscription = {
      backup: null,
      callback: callback,
      snapshot: snapshot,
      stale: false
    };

    var dispose = function dispose() {
      _this5._subscriptions["delete"](subscription);
    };

    this._subscriptions.add(subscription);

    return {
      dispose: dispose
    };
  };

  _proto.holdGC = function holdGC() {
    var _this6 = this;

    this._gcHoldCounter++;

    var dispose = function dispose() {
      if (_this6._gcHoldCounter > 0) {
        _this6._gcHoldCounter--;

        if (_this6._gcHoldCounter === 0 && _this6._shouldScheduleGC) {
          _this6._scheduleGC();

          _this6._shouldScheduleGC = false;
        }
      }
    };

    return {
      dispose: dispose
    };
  };

  _proto.toJSON = function toJSON() {
    return 'RelayModernStore()';
  } // Internal API
  ;

  _proto.__getUpdatedRecordIDs = function __getUpdatedRecordIDs() {
    return this._updatedRecordIDs;
  } // Returns the owner (RequestDescriptor) if the subscription was affected by the
  // latest update, or null if it was not affected.
  ;

  _proto._updateSubscription = function _updateSubscription(source, subscription) {
    var backup = subscription.backup,
        callback = subscription.callback,
        snapshot = subscription.snapshot,
        stale = subscription.stale;
    var hasOverlappingUpdates = hasOverlappingIDs(snapshot.seenRecords, this._updatedRecordIDs);

    if (!stale && !hasOverlappingUpdates) {
      return;
    }

    var nextSnapshot = hasOverlappingUpdates || !backup ? RelayReader.read(source, snapshot.selector) : backup;
    var nextData = recycleNodesInto(snapshot.data, nextSnapshot.data);
    nextSnapshot = {
      data: nextData,
      isMissingData: nextSnapshot.isMissingData,
      seenRecords: nextSnapshot.seenRecords,
      selector: nextSnapshot.selector
    };

    if (process.env.NODE_ENV !== "production") {
      deepFreeze(nextSnapshot);
    }

    subscription.snapshot = nextSnapshot;
    subscription.stale = false;

    if (nextSnapshot.data !== snapshot.data) {
      callback(nextSnapshot);
      return snapshot.selector.owner;
    }
  };

  _proto.lookupConnection_UNSTABLE = function lookupConnection_UNSTABLE(connectionReference, resolver) {
    var _connectionEvents$opt;

    !RelayFeatureFlags.ENABLE_CONNECTION_RESOLVERS ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernStore: Connection resolvers are not yet supported.') : invariant(false) : void 0;
    var id = connectionReference.id;
    var initialState = resolver.initialize();

    var connectionEvents = this._connectionEvents.get(id);

    var events = connectionEvents != null ? (_connectionEvents$opt = connectionEvents.optimistic) !== null && _connectionEvents$opt !== void 0 ? _connectionEvents$opt : connectionEvents["final"] : null;
    var initialSnapshot = {
      edgeSnapshots: {},
      id: id,
      reference: connectionReference,
      seenRecords: {},
      state: initialState
    };

    if (events == null || events.length === 0) {
      return initialSnapshot;
    }

    return this._reduceConnection_UNSTABLE(resolver, connectionReference, initialSnapshot, events);
  };

  _proto.subscribeConnection_UNSTABLE = function subscribeConnection_UNSTABLE(snapshot, resolver, callback) {
    var _this7 = this;

    !RelayFeatureFlags.ENABLE_CONNECTION_RESOLVERS ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernStore: Connection resolvers are not yet supported.') : invariant(false) : void 0;
    var id = String(this._index++);
    var subscription = {
      backup: null,
      callback: callback,
      id: id,
      resolver: resolver,
      snapshot: snapshot,
      stale: false
    };

    var dispose = function dispose() {
      _this7._connectionSubscriptions["delete"](id);
    };

    this._connectionSubscriptions.set(id, subscription);

    return {
      dispose: dispose
    };
  };

  _proto.publishConnectionEvents_UNSTABLE = function publishConnectionEvents_UNSTABLE(events, final) {
    var _this8 = this;

    if (events.length === 0) {
      return;
    }

    !RelayFeatureFlags.ENABLE_CONNECTION_RESOLVERS ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernStore: Connection resolvers are not yet supported.') : invariant(false) : void 0;
    var pendingConnectionEvents = new Map();
    events.forEach(function (event) {
      var connectionID = event.connectionID;
      var pendingEvents = pendingConnectionEvents.get(connectionID);

      if (pendingEvents == null) {
        pendingEvents = [];
        pendingConnectionEvents.set(connectionID, pendingEvents);
      }

      pendingEvents.push(event);

      var connectionEvents = _this8._connectionEvents.get(connectionID);

      if (connectionEvents == null) {
        connectionEvents = {
          "final": [],
          optimistic: null
        };

        _this8._connectionEvents.set(connectionID, connectionEvents);
      }

      if (final) {
        connectionEvents["final"].push(event);
      } else {
        var optimisticEvents = connectionEvents.optimistic;

        if (optimisticEvents == null) {
          optimisticEvents = connectionEvents["final"].slice();
          connectionEvents.optimistic = optimisticEvents;
        }

        optimisticEvents.push(event);
      }
    });

    this._connectionSubscriptions.forEach(function (subscription, id) {
      var pendingEvents = pendingConnectionEvents.get(subscription.snapshot.reference.id);

      if (pendingEvents == null) {
        return;
      }

      var nextSnapshot = _this8._updateConnection_UNSTABLE(subscription.resolver, subscription.snapshot, null, pendingEvents);

      if (nextSnapshot) {
        subscription.snapshot = nextSnapshot;
        subscription.stale = true;
      }
    });
  };

  _proto._updateConnection_UNSTABLE = function _updateConnection_UNSTABLE(resolver, snapshot, source, pendingEvents) {
    var _pendingEvents;

    var nextSnapshot = this._reduceConnection_UNSTABLE(resolver, snapshot.reference, snapshot, (_pendingEvents = pendingEvents) !== null && _pendingEvents !== void 0 ? _pendingEvents : [], source);

    var state = recycleNodesInto(snapshot.state, nextSnapshot.state);

    if (process.env.NODE_ENV !== "production") {
      deepFreeze(nextSnapshot);
    }

    if (state !== snapshot.state) {
      return (0, _objectSpread2["default"])({}, nextSnapshot, {
        state: state
      });
    }
  };

  _proto._reduceConnection_UNSTABLE = function _reduceConnection_UNSTABLE(resolver, connectionReference, snapshot, events) {
    var _this9 = this;

    var _edgesField$concreteT;

    var source = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
    var edgesField = connectionReference.edgesField,
        id = connectionReference.id,
        variables = connectionReference.variables;
    var fragment = {
      kind: 'Fragment',
      name: edgesField.name,
      type: (_edgesField$concreteT = edgesField.concreteType) !== null && _edgesField$concreteT !== void 0 ? _edgesField$concreteT : '__Any',
      metadata: null,
      argumentDefinitions: [],
      selections: edgesField.selections
    };
    var seenRecords = {};
    var edgeSnapshots = (0, _objectSpread2["default"])({}, snapshot.edgeSnapshots);
    var initialState = snapshot.state;

    if (source) {
      var edgeData = {};
      Object.keys(edgeSnapshots).forEach(function (edgeID) {
        var prevSnapshot = edgeSnapshots[edgeID];
        var nextSnapshot = RelayReader.read(_this9.getSource(), createReaderSelector(fragment, edgeID, variables, prevSnapshot.selector.owner));
        var data = recycleNodesInto(prevSnapshot.data, nextSnapshot.data);
        nextSnapshot = {
          data: data,
          isMissingData: nextSnapshot.isMissingData,
          seenRecords: nextSnapshot.seenRecords,
          selector: nextSnapshot.selector
        };

        if (data !== prevSnapshot.data) {
          edgeData[edgeID] = data;
          edgeSnapshots[edgeID] = nextSnapshot;
        }
      });

      if (Object.keys(edgeData).length !== 0) {
        initialState = resolver.reduce(initialState, {
          kind: 'update',
          edgeData: edgeData
        });
      }
    }

    var state = events.reduce(function (prevState, event) {
      if (event.kind === 'fetch') {
        var edges = [];
        event.edgeIDs.forEach(function (edgeID) {
          if (edgeID == null) {
            edges.push(edgeID);
            return;
          }

          var edgeSnapshot = RelayReader.read(_this9.getSource(), createReaderSelector(fragment, edgeID, variables, event.request));
          Object.assign(seenRecords, edgeSnapshot.seenRecords);
          var itemData = edgeSnapshot.data;
          edgeSnapshots[edgeID] = edgeSnapshot;
          edges.push(itemData);
        });
        return resolver.reduce(prevState, {
          kind: 'fetch',
          args: event.args,
          edges: edges,
          pageInfo: event.pageInfo,
          stream: event.stream
        });
      } else if (event.kind === 'insert') {
        var edgeSnapshot = RelayReader.read(_this9.getSource(), createReaderSelector(fragment, event.edgeID, variables, event.request));
        Object.assign(seenRecords, edgeSnapshot.seenRecords);
        var itemData = edgeSnapshot.data;
        edgeSnapshots[event.edgeID] = edgeSnapshot;
        return resolver.reduce(prevState, {
          args: event.args,
          edge: itemData,
          kind: 'insert'
        });
      } else if (event.kind === 'stream.edge') {
        var _edgeSnapshot = RelayReader.read(_this9.getSource(), createReaderSelector(fragment, event.edgeID, variables, event.request));

        Object.assign(seenRecords, _edgeSnapshot.seenRecords);
        var _itemData = _edgeSnapshot.data;
        edgeSnapshots[event.edgeID] = _edgeSnapshot;
        return resolver.reduce(prevState, {
          args: event.args,
          edge: _itemData,
          index: event.index,
          kind: 'stream.edge'
        });
      } else if (event.kind === 'stream.pageInfo') {
        return resolver.reduce(prevState, {
          args: event.args,
          kind: 'stream.pageInfo',
          pageInfo: event.pageInfo
        });
      } else {
        event.kind;
        !false ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernStore: Unexpected connection event kind `%s`.', event.kind) : invariant(false) : void 0;
      }
    }, initialState);
    return {
      edgeSnapshots: edgeSnapshots,
      id: id,
      reference: connectionReference,
      seenRecords: seenRecords,
      state: state
    };
  };

  _proto.snapshot = function snapshot() {
    !(this._optimisticSource == null) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernStore: Unexpected call to snapshot() while a previous ' + 'snapshot exists.') : invariant(false) : void 0;

    this._connectionSubscriptions.forEach(function (subscription) {
      subscription.backup = subscription.snapshot;
    });

    this._subscriptions.forEach(function (subscription) {
      subscription.backup = subscription.snapshot;
    });

    this._optimisticSource = RelayOptimisticRecordSource.create(this.getSource());
  };

  _proto.restore = function restore() {
    var _this10 = this;

    !(this._optimisticSource != null) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayModernStore: Unexpected call to restore(), expected a snapshot ' + 'to exist (make sure to call snapshot()).') : invariant(false) : void 0;
    this._optimisticSource = null;

    this._connectionEvents.forEach(function (events) {
      events.optimistic = null;
    });

    this._subscriptions.forEach(function (subscription) {
      var backup = subscription.backup;
      subscription.backup = null;

      if (backup) {
        if (backup.data !== subscription.snapshot.data) {
          subscription.stale = true;
        }

        subscription.snapshot = {
          data: subscription.snapshot.data,
          isMissingData: backup.isMissingData,
          seenRecords: backup.seenRecords,
          selector: backup.selector
        };
      } else {
        subscription.stale = true;
      }
    });

    this._connectionSubscriptions.forEach(function (subscription) {
      var backup = subscription.backup;
      subscription.backup = null;

      if (backup) {
        if (backup.state !== subscription.snapshot.state) {
          subscription.stale = true;
        }

        subscription.snapshot = backup;
      } else {
        // This subscription was established after the creation of the
        // connection snapshot so there's nothing to restore to. Recreate the
        // connection from scratch and check ifs value changes.
        var baseSnapshot = _this10.lookupConnection_UNSTABLE(subscription.snapshot.reference, subscription.resolver);

        var nextState = recycleNodesInto(subscription.snapshot.state, baseSnapshot.state);

        if (nextState !== subscription.snapshot.state) {
          subscription.stale = true;
        }

        subscription.snapshot = (0, _objectSpread2["default"])({}, baseSnapshot, {
          state: nextState
        });
      }
    });
  };

  _proto._scheduleGC = function _scheduleGC() {
    var _this11 = this;

    if (this._gcHoldCounter > 0) {
      this._shouldScheduleGC = true;
      return;
    }

    if (this._hasScheduledGC) {
      return;
    }

    this._hasScheduledGC = true;

    this._gcScheduler(function () {
      _this11.__gc();

      _this11._hasScheduledGC = false;
    });
  };

  _proto.__gc = function __gc() {
    var _this12 = this;

    // Don't run GC while there are optimistic updates applied
    if (this._optimisticSource != null) {
      return;
    }

    var references = new Set();
    var connectionReferences = new Set(); // Mark all records that are traversable from a root

    this._roots.forEach(function (selector) {
      RelayReferenceMarker.mark(_this12._recordSource, selector, references, connectionReferences, function (id) {
        return _this12.getConnectionEvents_UNSTABLE(id);
      }, _this12._operationLoader);
    });

    if (references.size === 0) {
      // Short-circuit if *nothing* is referenced
      this._recordSource.clear();
    } else {
      // Evict any unreferenced nodes
      var storeIDs = this._recordSource.getRecordIDs();

      for (var ii = 0; ii < storeIDs.length; ii++) {
        var dataID = storeIDs[ii];

        if (!references.has(dataID)) {
          this._recordSource.remove(dataID);
        }
      }
    }

    if (connectionReferences.size === 0) {
      this._connectionEvents.clear();
    } else {
      // Evict any unreferenced connections
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this._connectionEvents.keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var connectionID = _step.value;

          if (!connectionReferences.has(connectionID)) {
            this._connectionEvents["delete"](connectionID);
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  };

  return RelayModernStore;
}();
/**
 * Updates the target with information from source, also updating a mapping of
 * which records in the target were changed as a result.
 */


function updateTargetFromSource(target, source, updatedRecordIDs) {
  var dataIDs = source.getRecordIDs();

  for (var ii = 0; ii < dataIDs.length; ii++) {
    var dataID = dataIDs[ii];
    var sourceRecord = source.get(dataID);
    var targetRecord = target.get(dataID); // Prevent mutation of a record from outside the store.

    if (process.env.NODE_ENV !== "production") {
      if (sourceRecord) {
        RelayModernRecord.freeze(sourceRecord);
      }
    }

    if (sourceRecord && targetRecord) {
      var nextRecord = RelayModernRecord.update(targetRecord, sourceRecord);

      if (nextRecord !== targetRecord) {
        // Prevent mutation of a record from outside the store.
        if (process.env.NODE_ENV !== "production") {
          RelayModernRecord.freeze(nextRecord);
        }

        updatedRecordIDs[dataID] = true;
        target.set(dataID, nextRecord);
      }
    } else if (sourceRecord === null) {
      target["delete"](dataID);

      if (targetRecord !== null) {
        updatedRecordIDs[dataID] = true;
      }
    } else if (sourceRecord) {
      target.set(dataID, sourceRecord);
      updatedRecordIDs[dataID] = true;
    } // don't add explicit undefined

  }
}

RelayProfiler.instrumentMethods(RelayModernStore.prototype, {
  lookup: 'RelayModernStore.prototype.lookup',
  notify: 'RelayModernStore.prototype.notify',
  publish: 'RelayModernStore.prototype.publish',
  __gc: 'RelayModernStore.prototype.__gc'
});
module.exports = RelayModernStore;