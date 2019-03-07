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

var RelayConcreteNode = require("./RelayConcreteNode");

var RelayConcreteVariables = require("./RelayConcreteVariables");

var RelayConnectionHandler = require("./RelayConnectionHandler");

var RelayConnectionInterface = require("./RelayConnectionInterface");

var RelayCore = require("./RelayCore");

var RelayDeclarativeMutationConfig = require("./RelayDeclarativeMutationConfig");

var RelayDefaultHandleKey = require("./RelayDefaultHandleKey");

var RelayDefaultHandlerProvider = require("./RelayDefaultHandlerProvider");

var RelayError = require("./RelayError");

var RelayFeatureFlags = require("./RelayFeatureFlags");

var RelayInMemoryRecordSource = require("./RelayInMemoryRecordSource");

var RelayModernEnvironment = require("./RelayModernEnvironment");

var RelayModernFragmentOwner = require("./RelayModernFragmentOwner");

var RelayModernGraphQLTag = require("./RelayModernGraphQLTag");

var RelayModernStore = require("./RelayModernStore");

var RelayNetwork = require("./RelayNetwork");

var RelayNetworkLoggerTransaction = require("./RelayNetworkLoggerTransaction");

var RelayObservable = require("./RelayObservable");

var RelayProfiler = require("./RelayProfiler");

var RelayQueryResponseCache = require("./RelayQueryResponseCache");

var RelayStoreUtils = require("./RelayStoreUtils");

var RelayViewerHandler = require("./RelayViewerHandler");

var applyRelayModernOptimisticMutation = require("./applyRelayModernOptimisticMutation");

var commitLocalUpdate = require("./commitLocalUpdate");

var commitRelayModernMutation = require("./commitRelayModernMutation");

var createRelayNetworkLogger = require("./createRelayNetworkLogger");

var deepFreeze = require("./deepFreeze");

var fetchQueryInternal = require("./fetchQueryInternal");

var fetchRelayModernQuery = require("./fetchRelayModernQuery");

var generateRelayClientID = require("./generateRelayClientID");

var getFragmentIdentifier = require("./getFragmentIdentifier");

var getFragmentSpecIdentifier = require("./getFragmentSpecIdentifier");

var getOperationIdentifier = require("./getOperationIdentifier");

var getRelayHandleKey = require("./getRelayHandleKey");

var isRelayModernEnvironment = require("./isRelayModernEnvironment");

var isScalarAndEqual = require("./isScalarAndEqual");

var recycleNodesInto = require("./recycleNodesInto");

var requestRelaySubscription = require("./requestRelaySubscription");

var stableCopy = require("./stableCopy");

// As early as possible, check for the existence of the JavaScript globals which
// Relay Runtime relies upon, and produce a clear message if they do not exist.
if (process.env.NODE_ENV !== "production") {
  if (typeof Map !== 'function' || typeof Set !== 'function' || typeof Promise !== 'function' || typeof Object.assign !== 'function') {
    throw new Error('relay-runtime requires Map, Set, Promise, and Object.assign to exist. ' + 'Use a polyfill to provide these for older browsers.');
  }
}
/**
 * The public interface to Relay Runtime.
 */


module.exports = {
  // Core API
  Environment: RelayModernEnvironment,
  Network: RelayNetwork,
  Observable: RelayObservable,
  QueryResponseCache: RelayQueryResponseCache,
  RecordSource: RelayInMemoryRecordSource,
  Store: RelayModernStore,
  areEqualSelectors: RelayCore.areEqualSelectors,
  createFragmentSpecResolver: RelayCore.createFragmentSpecResolver,
  createOperationDescriptor: RelayCore.createOperationDescriptor,
  getDataIDsFromFragment: RelayCore.getDataIDsFromFragment,
  getDataIDsFromObject: RelayCore.getDataIDsFromObject,
  getFragment: RelayModernGraphQLTag.getFragment,
  getFragmentOwner: RelayModernFragmentOwner.getFragmentOwner,
  getFragmentOwners: RelayModernFragmentOwner.getFragmentOwners,
  getPaginationFragment: RelayModernGraphQLTag.getPaginationFragment,
  getRefetchableFragment: RelayModernGraphQLTag.getRefetchableFragment,
  getRequest: RelayModernGraphQLTag.getRequest,
  getSingularSelector: RelayCore.getSingularSelector,
  getPluralSelector: RelayCore.getPluralSelector,
  getSelector: RelayCore.getSelector,
  getSelectorsFromObject: RelayCore.getSelectorsFromObject,
  getStorageKey: RelayStoreUtils.getStorageKey,
  getVariablesFromSingularFragment: RelayCore.getVariablesFromSingularFragment,
  getVariablesFromPluralFragment: RelayCore.getVariablesFromPluralFragment,
  getVariablesFromFragment: RelayCore.getVariablesFromFragment,
  getVariablesFromObject: RelayCore.getVariablesFromObject,
  graphql: RelayModernGraphQLTag.graphql,
  // Declarative mutation API
  MutationTypes: RelayDeclarativeMutationConfig.MutationTypes,
  RangeOperations: RelayDeclarativeMutationConfig.RangeOperations,
  // Extensions
  DefaultHandlerProvider: RelayDefaultHandlerProvider,
  ConnectionHandler: RelayConnectionHandler,
  ViewerHandler: RelayViewerHandler,
  // Helpers (can be implemented via the above API)
  applyOptimisticMutation: applyRelayModernOptimisticMutation,
  commitLocalUpdate: commitLocalUpdate,
  commitMutation: commitRelayModernMutation,
  fetchQuery: fetchRelayModernQuery,
  isRelayModernEnvironment: isRelayModernEnvironment,
  requestSubscription: requestRelaySubscription,
  // Configuration interface for legacy or special uses
  ConnectionInterface: RelayConnectionInterface,
  // Utilities
  RelayProfiler: RelayProfiler,
  // INTERNAL-ONLY: These exports might be removed at any point.
  RelayConcreteNode: RelayConcreteNode,
  RelayError: RelayError,
  RelayFeatureFlags: RelayFeatureFlags,
  RelayNetworkLoggerTransaction: RelayNetworkLoggerTransaction,
  DEFAULT_HANDLE_KEY: RelayDefaultHandleKey.DEFAULT_HANDLE_KEY,
  FRAGMENTS_KEY: RelayStoreUtils.FRAGMENTS_KEY,
  FRAGMENT_OWNER_KEY: RelayStoreUtils.FRAGMENT_OWNER_KEY,
  ID_KEY: RelayStoreUtils.ID_KEY,
  REF_KEY: RelayStoreUtils.REF_KEY,
  REFS_KEY: RelayStoreUtils.REFS_KEY,
  ROOT_ID: RelayStoreUtils.ROOT_ID,
  ROOT_TYPE: RelayStoreUtils.ROOT_TYPE,
  TYPENAME_KEY: RelayStoreUtils.TYPENAME_KEY,
  createRelayNetworkLogger: createRelayNetworkLogger,
  deepFreeze: deepFreeze,
  generateClientID: generateRelayClientID,
  getRelayHandleKey: getRelayHandleKey,
  isScalarAndEqual: isScalarAndEqual,
  recycleNodesInto: recycleNodesInto,
  stableCopy: stableCopy,
  getOperationIdentifier: getOperationIdentifier,
  getFragmentIdentifier: getFragmentIdentifier,
  getFragmentSpecIdentifier: getFragmentSpecIdentifier,
  __internal: {
    getModernOperationVariables: RelayConcreteVariables.getOperationVariables,
    fetchQuery: fetchQueryInternal.fetchQuery,
    getPromiseForRequestInFlight: fetchQueryInternal.getPromiseForRequestInFlight
  }
};