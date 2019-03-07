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

var RelayCore = require("./RelayCore");

var getDataIDsFromFragment = RelayCore.getDataIDsFromFragment,
    getVariablesFromFragment = RelayCore.getVariablesFromFragment;

var _require = require("./RelayModernFragmentOwner"),
    getFragmentOwner = _require.getFragmentOwner;

var stableCopy = require("./stableCopy");

function getFragmentIdentifier(fragmentNode, fragmentRef) {
  var _fragmentOwner$node$p;

  var fragmentOwner = getFragmentOwner(fragmentNode, // $FlowFixMe - TODO T39154660 Use FragmentPointer type instead of mixed
  fragmentRef);
  var fragmentVariables = getVariablesFromFragment( // We get the variables from the fragment owner in the fragment ref, so we
  // don't pass them here. This API can change once fragment ownership
  // stops being optional
  // TODO(T39494051)
  {}, fragmentNode, fragmentRef, fragmentOwner);
  var dataIDs = getDataIDsFromFragment(fragmentNode, fragmentRef); // We don't need to include the fragment owner variables since those
  // are already encoded in the fragmentVariables

  var fragmentOwnerID = Array.isArray(fragmentOwner) ? fragmentOwner.map(function (owner) {
    var _ref, _ref2;

    return (_ref = (_ref2 = owner === null || owner === void 0 ? void 0 : owner.node.params.id) !== null && _ref2 !== void 0 ? _ref2 : owner === null || owner === void 0 ? void 0 : owner.node.params.name) !== null && _ref !== void 0 ? _ref : null;
  }) : fragmentOwner != null ? (_fragmentOwner$node$p = fragmentOwner.node.params.id) !== null && _fragmentOwner$node$p !== void 0 ? _fragmentOwner$node$p : fragmentOwner.node.params.name : null;
  return "".concat(fragmentNode.name, "-").concat(JSON.stringify(stableCopy({
    dataIDs: dataIDs,
    fragmentVariables: fragmentVariables,
    fragmentOwnerID: fragmentOwnerID
  })));
}

module.exports = getFragmentIdentifier;