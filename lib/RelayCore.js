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

var RelayModernFragmentSpecResolver = require("./RelayModernFragmentSpecResolver");

var warning = require("fbjs/lib/warning");

var _require = require("./RelayModernGraphQLTag"),
    getFragment = _require.getFragment,
    getPaginationFragment = _require.getPaginationFragment,
    getRefetchableFragment = _require.getRefetchableFragment,
    getRequest = _require.getRequest,
    isFragment = _require.isFragment,
    isRequest = _require.isRequest;

var _require2 = require("./RelayModernOperationDescriptor"),
    createOperationDescriptor = _require2.createOperationDescriptor;

var _require3 = require("./RelayModernSelector"),
    areEqualSelectors = _require3.areEqualSelectors,
    getDataIDsFromFragment = _require3.getDataIDsFromFragment,
    getDataIDsFromObject = _require3.getDataIDsFromObject,
    getSingularSelector = _require3.getSingularSelector,
    getPluralSelector = _require3.getPluralSelector,
    getSelector = _require3.getSelector,
    getSelectorsFromObject = _require3.getSelectorsFromObject,
    getVariablesFromSingularFragment = _require3.getVariablesFromSingularFragment,
    getVariablesFromPluralFragment = _require3.getVariablesFromPluralFragment,
    getVariablesFromFragment = _require3.getVariablesFromFragment,
    getVariablesFromObject = _require3.getVariablesFromObject;

function createFragmentSpecResolver(context, containerName, fragments, props, callback) {
  if (process.env.NODE_ENV !== "production") {
    var fragmentNames = Object.keys(fragments);
    fragmentNames.forEach(function (fragmentName) {
      var propValue = props[fragmentName];
      process.env.NODE_ENV !== "production" ? warning(propValue !== undefined, 'createFragmentSpecResolver: Expected prop `%s` to be supplied to `%s`, but ' + 'got `undefined`. Pass an explicit `null` if this is intentional.', fragmentName, containerName) : void 0;
    });
  }

  return new RelayModernFragmentSpecResolver(context, fragments, props, callback);
}

module.exports = {
  areEqualSelectors: areEqualSelectors,
  createFragmentSpecResolver: createFragmentSpecResolver,
  createOperationDescriptor: createOperationDescriptor,
  getDataIDsFromFragment: getDataIDsFromFragment,
  getDataIDsFromObject: getDataIDsFromObject,
  getFragment: getFragment,
  getPaginationFragment: getPaginationFragment,
  getRefetchableFragment: getRefetchableFragment,
  getRequest: getRequest,
  getSingularSelector: getSingularSelector,
  getPluralSelector: getPluralSelector,
  getSelector: getSelector,
  getSelectorsFromObject: getSelectorsFromObject,
  getVariablesFromSingularFragment: getVariablesFromSingularFragment,
  getVariablesFromPluralFragment: getVariablesFromPluralFragment,
  getVariablesFromFragment: getVariablesFromFragment,
  getVariablesFromObject: getVariablesFromObject,
  isFragment: isFragment,
  isRequest: isRequest
};