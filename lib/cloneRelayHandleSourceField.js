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

var areEqual = require("fbjs/lib/areEqual");

var invariant = require("fbjs/lib/invariant");

var _require = require("./RelayConcreteNode"),
    LINKED_FIELD = _require.LINKED_FIELD;

var _require2 = require("./RelayStoreUtils"),
    getHandleStorageKey = _require2.getHandleStorageKey;

/**
 * @private
 *
 * Creates a clone of the supplied `handleField` by finding the original linked
 * field (on which the handle was declared) among the sibling `selections`, and
 * copying its selections into the clone.
 */
function cloneRelayHandleSourceField(handleField, selections, variables) {
  var sourceField = selections.find(function (source) {
    return source.kind === LINKED_FIELD && source.name === handleField.name && source.alias === handleField.alias && areEqual(source.args, handleField.args);
  });
  !(sourceField && sourceField.kind === LINKED_FIELD) ? process.env.NODE_ENV !== "production" ? invariant(false, 'cloneRelayHandleSourceField: Expected a corresponding source field for ' + 'handle `%s`.', handleField.handle) : invariant(false) : void 0;
  var handleKey = getHandleStorageKey(handleField, variables);
  var clonedField = (0, _objectSpread2["default"])({}, sourceField, {
    args: null,
    name: handleKey,
    storageKey: handleKey
  });
  return clonedField;
}

module.exports = cloneRelayHandleSourceField;