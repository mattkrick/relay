/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 * @format
 */

'use strict';

var _classCallCheck3 = _interopRequireDefault(require('babel-runtime/helpers/classCallCheck'));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var NETWORK_ONLY = 'NETWORK_ONLY';
var STORE_THEN_NETWORK = 'STORE_THEN_NETWORK';
var DataFromEnum = {
  NETWORK_ONLY: NETWORK_ONLY,
  STORE_THEN_NETWORK: STORE_THEN_NETWORK
};

var ReactRelayQueryFetcher = function () {
  function ReactRelayQueryFetcher() {
    (0, _classCallCheck3['default'])(this, ReactRelayQueryFetcher);
    this._selectionReferences = [];
  }

  // results of the root fragment;

  /**
   * `fetch` fetches the data for the given operation.
   * If a result is immediately available synchronously, it will be synchronously
   * returned by this function.
   *
   * Otherwise, the fetched result will be communicated via the `onDataChange` callback.
   * `onDataChange` will be called with the first result (**if it wasn't returned synchronously**),
   * and then subsequently whenever the data changes.
   */
  ReactRelayQueryFetcher.prototype.fetch = function fetch(fetchOptions) {
    var _this = this;

    var cacheConfig = fetchOptions.cacheConfig,
        _fetchOptions$dataFro = fetchOptions.dataFrom,
        dataFrom = _fetchOptions$dataFro === undefined ? NETWORK_ONLY : _fetchOptions$dataFro,
        environment = fetchOptions.environment,
        onDataChange = fetchOptions.onDataChange,
        operation = fetchOptions.operation;
    var createOperationSelector = environment.unstable_internal.createOperationSelector;

    var nextReferences = [];
    var fetchHasReturned = false;
    var error = void 0;

    this._disposeRequest();
    this._fetchOptions = fetchOptions;

    // Check if we can fulfill this query with data already available in memory,
    // and immediatly return data if so
    if (dataFrom === STORE_THEN_NETWORK && environment.check(operation.root)) {
      this._cacheReference = environment.retain(operation.root);
      // Don't notify the first result because it will be returned synchronously
      this._onQueryDataAvailable({ notifyFirstResult: false });
    }

    var request = environment.execute({ operation: operation, cacheConfig: cacheConfig })['finally'](function () {
      _this._pendingRequest = null;
      _this._disposeCacheReference();
    }).subscribe({
      next: function next(payload) {
        var operationForPayload = createOperationSelector(operation.node, payload.variables, payload.operation);
        nextReferences.push(environment.retain(operationForPayload.root));
        _this._disposeCacheReference();

        // Only notify of the first result if `next` is being called **asynchronously**
        // (i.e. after `fetch` has returned).
        _this._onQueryDataAvailable({ notifyFirstResult: fetchHasReturned });
      },
      error: function (_error) {
        function error(_x) {
          return _error.apply(this, arguments);
        }

        error.toString = function () {
          return _error.toString();
        };

        return error;
      }(function (err) {
        // We may have partially fulfilled the request, so let the next request
        // or the unmount dispose of the references.
        _this._selectionReferences = _this._selectionReferences.concat(nextReferences);

        // Only notify of error if `error` is being called **asynchronously**
        // (i.e. after `fetch` has returned).
        if (fetchHasReturned) {
          onDataChange({ error: err });
        } else {
          error = err;
        }
      }),
      complete: function complete() {
        _this._disposeSelectionReferences();
        _this._selectionReferences = nextReferences;
      },
      unsubscribe: function unsubscribe() {
        // Let the next request or the unmount code dispose of the references.
        // We may have partially fulfilled the request.
        _this._selectionReferences = _this._selectionReferences.concat(nextReferences);
      }
    });

    this._pendingRequest = {
      dispose: function dispose() {
        request.unsubscribe();
      }
    };

    fetchHasReturned = true;
    if (error) {
      throw error;
    }
    return this._snapshot;
  };

  ReactRelayQueryFetcher.prototype.retry = function retry() {
    require('fbjs/lib/invariant')(this._fetchOptions, 'ReactRelayQueryFetcher: `retry` should be called after having called `fetch`');
    return this.fetch(this._fetchOptions);
  };

  ReactRelayQueryFetcher.prototype.dispose = function dispose() {
    this._disposeRequest();
    this._disposeSelectionReferences();
  };

  ReactRelayQueryFetcher.prototype._disposeCacheReference = function _disposeCacheReference() {
    if (this._cacheReference) {
      this._cacheReference.dispose();
      this._cacheReference = null;
    }
  };

  ReactRelayQueryFetcher.prototype._disposeRequest = function _disposeRequest() {
    this._snapshot = null;
    this._disposeCacheReference();

    // order is important, dispose of pendingFetch before selectionReferences
    if (this._pendingRequest) {
      this._pendingRequest.dispose();
    }
    if (this._rootSubscription) {
      this._rootSubscription.dispose();
      this._rootSubscription = null;
    }
  };

  ReactRelayQueryFetcher.prototype._disposeSelectionReferences = function _disposeSelectionReferences() {
    this._selectionReferences.forEach(function (r) {
      return r.dispose();
    });
    this._selectionReferences = [];
  };

  ReactRelayQueryFetcher.prototype._onQueryDataAvailable = function _onQueryDataAvailable(_ref) {
    var notifyFirstResult = _ref.notifyFirstResult;

    require('fbjs/lib/invariant')(this._fetchOptions, 'ReactRelayQueryFetcher: `_onQueryDataAvailable` should have been called after having called `fetch`');
    var _fetchOptions = this._fetchOptions,
        environment = _fetchOptions.environment,
        onDataChange = _fetchOptions.onDataChange,
        operation = _fetchOptions.operation;

    // `_onQueryDataAvailable` can be called synchronously the first time and can be called
    // multiple times by network layers that support data subscriptions.
    // Wait until the first payload to call `onDataChange` and subscribe for data updates.

    if (this._snapshot) {
      return;
    }
    this._snapshot = environment.lookup(operation.fragment);

    // Subscribe to changes in the data of the root fragment
    this._rootSubscription = environment.subscribe(this._snapshot, function (snapshot) {
      return onDataChange({ snapshot: snapshot });
    });

    if (this._snapshot && notifyFirstResult) {
      onDataChange({ snapshot: this._snapshot });
    }
  };

  return ReactRelayQueryFetcher;
}();

ReactRelayQueryFetcher.DataFrom = DataFromEnum;


module.exports = ReactRelayQueryFetcher;