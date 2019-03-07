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

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var Observable = require("./RelayObservable");

var getOperationIdentifier = require("./getOperationIdentifier");

var invariant = require("fbjs/lib/invariant");

var requestCachesByEnvironment = new Map();
/**
 * Fetches the given query and variables on the provided environment,
 * and de-dupes identical in-flight requests.
 *
 * Observing a request:
 * ====================
 * fetchQuery returns an Observable which you can call .subscribe()
 * on. subscribe() takes an Observer, which you can provide to
 * observe network events:
 *
 * ```
 * fetchQuery(environment, query, variables).subscribe({
 *   // Called when network requests starts
 *   start: (subscription) => {},
 *
 *   // Called after a payload is received and written to the local store
 *   next: (payload) => {},
 *
 *   // Called when network requests errors
 *   error: (error) => {},
 *
 *   // Called when network requests fully completes
 *   complete: () => {},
 *
 *   // Called when network request is unsubscribed
 *   unsubscribe: (subscription) => {},
 * });
 * ```
 *
 * In-flight request de-duping:
 * ============================
 * By default, calling fetchQuery multiple times with the same
 * environment, query and variables will not initiate a new request if a request
 * for those same parameters is already in flight.
 *
 * A request is marked in-flight from the moment it starts until the moment it
 * fully completes, regardless of error or successful completion.
 *
 * NOTE: If the request completes _synchronously_, calling fetchQuery
 * a second time with the same arguments in the same tick will _NOT_ de-dupe
 * the request given that it will no longer be in-flight.
 *
 *
 * Data Retention:
 * ===============
 * This function will not retain any query data outside the scope of the
 * request, which means it is not guaranteed that it won't be garbage
 * collected after the request completes.
 * If you need to retain data, you can do so manually with environment.retain().
 *
 * Cancelling requests:
 * ====================
 * If the subscription returned by subscribe is called while the
 * request is in-flight, apart from releasing retained data, the request will
 * also be cancelled.
 *
 * ```
 * const subscription = fetchQuery(...).subscribe(...);
 *
 * // This will cancel the request if it is in-flight.
 * subscription.unsubscribe();
 * ```
 * @private
 */

function fetchQuery(environment, query, options) {
  return Observable.create(function (sink) {
    var networkCacheConfig = options === null || options === void 0 ? void 0 : options.networkCacheConfig;
    var requestCache = getRequestCache(environment);
    var cacheKey = getOperationIdentifier(query);
    var cachedRequest = requestCache.get(cacheKey);

    if (cachedRequest) {
      // We manage observers manually due to the lack of an RxJS Subject abstraction
      // (https://fburl.com/s6m56gim)
      var observers = sink && !cachedRequest.observers.find(function (o) {
        return o === sink;
      }) ? (0, _toConsumableArray2["default"])(cachedRequest.observers).concat([sink]) : cachedRequest.observers;
      cachedRequest.receivedEvents.forEach(function (observerEvent) {
        var data = observerEvent.data;
        var eventHandler = sink[observerEvent.event];

        if (data !== undefined) {
          eventHandler && eventHandler(data);
        } else {
          eventHandler && eventHandler();
        }
      });
      requestCache.set(cacheKey, (0, _objectSpread2["default"])({}, cachedRequest, {
        count: cachedRequest.count + 1,
        observers: observers
      }));
    } else {
      environment.execute({
        operation: query,
        cacheConfig: networkCacheConfig
      }).map(function (payload) {
        return payload;
      })["finally"](function () {
        requestCache["delete"](cacheKey);
      }).subscribe({
        start: function start(subscription) {
          requestCache.set(cacheKey, {
            count: 1,
            subscription: subscription,
            observers: sink ? [sink] : [],
            receivedEvents: []
          });
        },
        next: function next() {
          var snapshot = environment.lookup(query.fragment, query);
          addReceivedEvent(requestCache, cacheKey, {
            event: 'next',
            data: snapshot
          });
          getCachedObservers(requestCache, cacheKey).forEach(function (o) {
            return o.next && o.next(snapshot);
          });
        },
        error: function error(_error) {
          addReceivedEvent(requestCache, cacheKey, {
            event: 'error',
            data: _error
          });
          getCachedObservers(requestCache, cacheKey).forEach(function (o) {
            return o.error && o.error(_error);
          });
        },
        complete: function complete() {
          addReceivedEvent(requestCache, cacheKey, {
            event: 'complete'
          });
          getCachedObservers(requestCache, cacheKey).forEach(function (o) {
            return o.complete && o.complete();
          });
        },
        unsubscribe: function unsubscribe(subscription) {}
      });
    }

    return function () {
      var cachedRequestInstance = requestCache.get(cacheKey);

      if (cachedRequestInstance) {
        if (cachedRequestInstance.count === 1) {
          cachedRequestInstance.subscription.unsubscribe();
          requestCache["delete"](cacheKey);
        } else {
          requestCache.set(cacheKey, (0, _objectSpread2["default"])({}, cachedRequestInstance, {
            count: cachedRequestInstance.count - 1
          }));
        }
      }
    };
  });
}
/**
 * If a request is in flight for the given query, variables and environment,
 * this function will return a Promise that will resolve when that request has
 * completed and the data has been saved to the store.
 * If no request is in flight, null will be returned
 * @private
 */


function getPromiseForRequestInFlight(environment, query) {
  var requestCache = getRequestCache(environment);
  var cacheKey = getOperationIdentifier(query);
  var cachedRequest = requestCache.get(cacheKey);

  if (!cachedRequest) {
    return null;
  }

  var receivedEvents = cachedRequest.receivedEvents;
  var receivedNextCount = receivedEvents.filter(function (e) {
    return e.event === 'next';
  }).length;
  return new Promise(function (resolve, reject) {
    fetchQuery(environment, query).subscribe({
      complete: resolve,
      error: reject,
      next: function next() {
        // NOTE: Only resolve the promise upon the next call to `next`.
        // Otherwise, resolving for calls to `next` that have already occurred
        // will cause the promise to resolve immediately
        if (receivedNextCount-- <= 0) {
          resolve();
        }
      }
    });
  });
}

function addReceivedEvent(requestCache, cacheKey, observerEvent) {
  var cached = requestCache.get(cacheKey);
  !(cached != null) ? process.env.NODE_ENV !== "production" ? invariant(false, '[fetchQueryInternal] addReceivedEvent: Expected request to be cached') : invariant(false) : void 0;
  var receivedEvents = (0, _toConsumableArray2["default"])(cached.receivedEvents).concat([observerEvent]);
  requestCache.set(cacheKey, (0, _objectSpread2["default"])({}, cached, {
    receivedEvents: receivedEvents
  }));
}

function getRequestCache(environment) {
  var cached = requestCachesByEnvironment.get(environment);

  if (cached != null) {
    return cached;
  }

  var requestCache = new Map();
  requestCachesByEnvironment.set(environment, requestCache);
  return requestCache;
}

function getCachedObservers(requestCache, cacheKey) {
  var cached = requestCache.get(cacheKey);
  !(cached != null) ? process.env.NODE_ENV !== "production" ? invariant(false, '[fetchQueryInternal] getCachedObservers: Expected request to be cached') : invariant(false) : void 0;
  return cached.observers;
}

module.exports = {
  fetchQuery: fetchQuery,
  getPromiseForRequestInFlight: getPromiseForRequestInFlight
};