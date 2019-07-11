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

var RelayCore = require("./RelayCore");

var getDataIDsFromFragment = RelayCore.getDataIDsFromFragment,
    getVariablesFromFragment = RelayCore.getVariablesFromFragment;

var _require = require("./RelayModernFragmentOwner"),
    getFragmentOwner = _require.getFragmentOwner;

var stableCopy = require("./stableCopy");

function getFragmentIdentifier(fragmentNode, fragmentRef) {
  var _ref3, _ref4, _ref6;

  var fragmentOwner = getFragmentOwner(fragmentNode, // $FlowFixMe - TODO T39154660 Use FragmentPointer type instead of mixed
  fragmentRef);
  var fragmentVariables = getVariablesFromFragment( // We get the variables from the fragment owner in the fragment ref, so we
  // don't pass them here. This API can change once fragment ownership
  // stops being optional
  // TODO(T39494051)
  {}, fragmentNode, fragmentRef, fragmentOwner);
  var dataIDs = getDataIDsFromFragment(fragmentNode, fragmentRef);
  var fragmentOwnerID = Array.isArray(fragmentOwner) ? fragmentOwner.map(function (owner) {
    var _ref, _ref2;

    return (_ref = (_ref2 = owner === null || owner === void 0 ? void 0 : owner.node.params.id) !== null && _ref2 !== void 0 ? _ref2 : owner === null || owner === void 0 ? void 0 : owner.node.params.name) !== null && _ref !== void 0 ? _ref : '';
  }) : (_ref3 = (_ref4 = fragmentOwner === null || fragmentOwner === void 0 ? void 0 : fragmentOwner.node.params.id) !== null && _ref4 !== void 0 ? _ref4 : fragmentOwner === null || fragmentOwner === void 0 ? void 0 : fragmentOwner.node.params.name) !== null && _ref3 !== void 0 ? _ref3 : '';
  var fragmentOwnerVariables = Array.isArray(fragmentOwner) ? fragmentOwner.map(function (owner) {
    var _ref5;

    return (_ref5 = owner === null || owner === void 0 ? void 0 : owner.variables) !== null && _ref5 !== void 0 ? _ref5 : null;
  }) : (_ref6 = fragmentOwner === null || fragmentOwner === void 0 ? void 0 : fragmentOwner.variables) !== null && _ref6 !== void 0 ? _ref6 : null;
  return "".concat(fragmentNode.name, "-").concat(JSON.stringify(stableCopy({
    dataIDs: dataIDs,
    fragmentVariables: fragmentVariables,
    fragmentOwnerID: fragmentOwnerID,
    fragmentOwnerVariables: fragmentOwnerVariables
  })));
}

module.exports = getFragmentIdentifier;