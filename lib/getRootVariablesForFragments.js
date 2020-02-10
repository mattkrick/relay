/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 * @format
 */
// flowlint ambiguous-object-type:error
'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _require = require('relay-runtime'),
    getSelector = _require.getSelector;

function getRootVariablesForFragments(fragments, props) {
  var rootVariables = {}; // NOTE: For extra safety, we make sure the rootVariables include the
  // variables from all owners in this fragmentSpec, even though they
  // should all point to the same owner

  Object.keys(fragments).forEach(function (key) {
    var _ref, _selector$selectors$, _ref2;

    var fragmentNode = fragments[key];
    var fragmentRef = props[key];
    var selector = getSelector(fragmentNode, fragmentRef);
    var fragmentOwnerVariables = selector != null && selector.kind === 'PluralReaderSelector' ? (_ref = (_selector$selectors$ = selector.selectors[0]) === null || _selector$selectors$ === void 0 ? void 0 : _selector$selectors$.owner.variables) !== null && _ref !== void 0 ? _ref : {} : (_ref2 = selector === null || selector === void 0 ? void 0 : selector.owner.variables) !== null && _ref2 !== void 0 ? _ref2 : {};
    rootVariables = (0, _objectSpread2["default"])({}, rootVariables, fragmentOwnerVariables);
  });
  return rootVariables;
}

module.exports = getRootVariablesForFragments;