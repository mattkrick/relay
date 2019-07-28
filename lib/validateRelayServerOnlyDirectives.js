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

var GraphQLIRValidator = require("./GraphQLIRValidator");

var _require = require("./RelayCompilerError"),
    createUserError = _require.createUserError;

var NODEKIND_DIRECTIVE_MAP = {
  Defer: 'defer',
  Stream: 'stream'
};
/*
 * Validate that server-only directives are not used inside client fields
 */

function validateRelayServerOnlyDirectives(context) {
  GraphQLIRValidator.validate(context, {
    ClientExtension: visitClientExtension,
    Defer: visitTransformedDirective,
    Stream: visitTransformedDirective
  }, function () {
    return {
      rootClientSelection: null
    };
  });
}

function visitClientExtension(node, state) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = node.selections[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var selection = _step.value;
      this.visit(selection, {
        rootClientSelection: selection
      });
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

function visitTransformedDirective(node, state) {
  if (state.rootClientSelection) {
    throwError("@".concat(NODEKIND_DIRECTIVE_MAP[node.kind]), node.loc, state.rootClientSelection.loc);
  } // directive used only on client fields


  if (node.selections.every(function (sel) {
    return sel.kind === 'ClientExtension';
  })) {
    var _clientExtension$sele;

    var clientExtension = node.selections[0];
    throwError("@".concat(NODEKIND_DIRECTIVE_MAP[node.kind]), node.loc, clientExtension && clientExtension.kind === 'ClientExtension' ? (_clientExtension$sele = clientExtension.selections[0]) === null || _clientExtension$sele === void 0 ? void 0 : _clientExtension$sele.loc : null);
  }

  this.traverse(node, state);
}

function throwError(directiveName, directiveLoc, clientExtensionLoc) {
  throw createUserError("Unexpected directive: ".concat(directiveName, ". ") + 'This directive can only be used on fields/fragments that are ' + 'fetched from the server schema, but it is used ' + 'inside a client-only selection.', clientExtensionLoc == null || directiveLoc === clientExtensionLoc ? [directiveLoc] : [directiveLoc, clientExtensionLoc]);
}

module.exports = validateRelayServerOnlyDirectives;