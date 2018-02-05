/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule RelayModernMockEnvironment
 * @format
 */

'use strict';

var MAX_SIZE = 10;
var MAX_TTL = 5 * 60 * 1000; // 5 min

function mockInstanceMethod(object, key) {
  object[key] = jest.fn(object[key].bind(object));
}

function mockDisposableMethod(object, key) {
  var fn = object[key].bind(object);
  object[key] = jest.fn(function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var disposable = fn.apply(undefined, args);
    var dispose = jest.fn(function () {
      return disposable.dispose();
    });
    object[key].mock.dispose = dispose;
    return { dispose: dispose };
  });
  var mockClear = object[key].mockClear.bind(object[key]);
  object[key].mockClear = function () {
    mockClear();
    object[key].mock.dispose = null;
  };
}

function mockObservableMethod(object, key) {
  var fn = object[key].bind(object);
  object[key] = jest.fn(function () {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return fn.apply(undefined, args)['do']({
      start: function start(subscription) {
        object[key].mock.subscriptions.push(subscription);
      }
    });
  });
  object[key].mock.subscriptions = [];
  var mockClear = object[key].mockClear.bind(object[key]);
  object[key].mockClear = function () {
    mockClear();
    object[key].mock.subscriptions = [];
  };
}

/**
 * Creates an instance of the `Environment` interface defined in
 * RelayStoreTypes with a mocked network layer.
 *
 * Usage:
 *
 * ```
 * const environment = RelayModernMockEnvironment.createMockEnvironment();
 * ```
 *
 * Mock API:
 *
 * Helpers are available as `environment.mock.<helper>`:
 *
 * - `compile(text: string): {[queryName]: Query}`: Create a query.
 * - `isLoading(query, variables): boolean`: Determine whether the given query
 *   is currently being loaded (not yet rejected/resolved).
 * - `reject(query, error: Error): void`: Reject a query that has been fetched
 *   by the environment.
 * - `resolve(query, payload: PayloadData): void`: Resolve a query that has been
 *   fetched by the environment.
 */
function createMockEnvironment(options) {
  var RecordSource = require('relay-runtime').RecordSource,
      Store = require('relay-runtime').Store,
      QueryResponseCache = require('relay-runtime').QueryResponseCache,
      Observable = require('relay-runtime').Observable,
      Environment = require('relay-runtime').Environment,
      Network = require('relay-runtime').Network; // destructure here to make jest and inline-requires work


  var schema = options && options.schema;
  var handlerProvider = options && options.handlerProvider;
  var source = new RecordSource();
  var store = new Store(source);
  var cache = new QueryResponseCache({
    size: MAX_SIZE,
    ttl: MAX_TTL
  });

  // Mock the network layer
  var pendingRequests = [];
  var execute = function execute(request, variables, cacheConfig) {
    var id = request.id,
        text = request.text;

    var cacheID = id || text;

    var cachedPayload = null;
    if (!cacheConfig || !cacheConfig.force) {
      cachedPayload = cache.get(cacheID, variables);
    }
    if (cachedPayload !== null) {
      return Observable.from(cachedPayload);
    }

    var nextRequest = { request: request, variables: variables, cacheConfig: cacheConfig };
    pendingRequests = pendingRequests.concat([nextRequest]);

    return Observable.create(function (sink) {
      nextRequest.sink = sink;
      return function () {
        pendingRequests = pendingRequests.filter(function (pending) {
          return pending !== nextRequest;
        });
      };
    });
  };

  function getRequest(request) {
    var foundRequest = pendingRequests.find(function (pending) {
      return pending.request === request;
    });
    require('fbjs/lib/invariant')(foundRequest && foundRequest.sink, 'MockEnvironment: Cannot respond to `%s`, it has not been requested yet.', request.name);
    return foundRequest;
  }

  function ensureValidPayload(payload) {
    require('fbjs/lib/invariant')(typeof payload === 'object' && payload !== null && payload.hasOwnProperty('data'), 'MockEnvironment(): Expected payload to be an object with a `data` key.');
    return payload;
  }

  var cachePayload = function cachePayload(request, variables, payload) {
    var id = request.id,
        text = request.text;

    var cacheID = id || text;
    cache.set(cacheID, variables, payload);
  };

  var clearCache = function clearCache() {
    cache.clear();
  };

  if (!schema) {
    global.__RELAYOSS__ = true;
  }

  // Helper to compile a query with the given schema (or the test schema by
  // default).
  var compile = function compile(text) {
    return require('./RelayModernTestUtils').generateAndCompile(text, schema || require('./RelayTestSchema'));
  };

  // Helper to determine if a given query/variables pair is pending
  var isLoading = function isLoading(request, variables, cacheConfig) {
    return pendingRequests.some(function (pending) {
      return pending.request === request && require('fbjs/lib/areEqual')(pending.variables, variables) && require('fbjs/lib/areEqual')(pending.cacheConfig, cacheConfig || {});
    });
  };

  // Helpers to reject or resolve the payload for an individual request.
  var reject = function reject(request, error) {
    if (typeof error === 'string') {
      error = new Error(error);
    }
    getRequest(request).sink.error(error);
  };

  var nextValue = function nextValue(request, payload) {
    var _getRequest = getRequest(request),
        sink = _getRequest.sink,
        variables = _getRequest.variables;

    sink.next({
      operation: request.operation,
      variables: variables,
      response: ensureValidPayload(payload)
    });
  };

  var complete = function complete(request) {
    getRequest(request).sink.complete();
  };

  var resolve = function resolve(request, payload) {
    var _getRequest2 = getRequest(request),
        sink = _getRequest2.sink,
        variables = _getRequest2.variables;

    sink.next({
      operation: request.operation,
      variables: variables,
      response: ensureValidPayload(payload)
    });
    sink.complete();
  };

  // Mock instance
  var environment = new Environment({
    configName: 'RelayModernMockEnvironment',
    handlerProvider: handlerProvider,
    network: Network.create(execute, execute),
    store: store
  });
  // Mock all the functions with their original behavior
  mockDisposableMethod(environment, 'applyUpdate');
  mockInstanceMethod(environment, 'commitPayload');
  mockInstanceMethod(environment, 'getStore');
  mockInstanceMethod(environment, 'lookup');
  mockInstanceMethod(environment, 'check');
  mockDisposableMethod(environment, 'subscribe');
  mockDisposableMethod(environment, 'retain');
  mockObservableMethod(environment, 'execute');
  mockObservableMethod(environment, 'executeMutation');

  mockInstanceMethod(store, 'getSource');
  mockInstanceMethod(store, 'lookup');
  mockInstanceMethod(store, 'notify');
  mockInstanceMethod(store, 'publish');
  mockDisposableMethod(store, 'retain');
  mockDisposableMethod(store, 'subscribe');

  environment.mock = {
    cachePayload: cachePayload,
    clearCache: clearCache,
    compile: compile,
    isLoading: isLoading,
    reject: reject,
    resolve: resolve,
    nextValue: nextValue,
    complete: complete
  };

  environment.mockClear = function () {
    environment.applyUpdate.mockClear();
    environment.commitPayload.mockClear();
    environment.getStore.mockClear();
    environment.lookup.mockClear();
    environment.check.mockClear();
    environment.subscribe.mockClear();
    environment.retain.mockClear();
    environment.execute.mockClear();
    environment.executeMutation.mockClear();

    store.getSource.mockClear();
    store.lookup.mockClear();
    store.notify.mockClear();
    store.publish.mockClear();
    store.retain.mockClear();
    store.subscribe.mockClear();

    cache.clear();

    pendingRequests = [];
  };

  return environment;
}

module.exports = { createMockEnvironment: createMockEnvironment };