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

var _require2 = require("./getFieldDefinition"),
    getFieldDefinitionStrict = _require2.getFieldDefinitionStrict;

var _require3 = require("graphql"),
    isRequiredArgument = _require3.isRequiredArgument;

/*
 * Validate requierd arguments are provided after transforms filling in arguments
 */
function validateRelayRequiredArguments(context) {
  GraphQLIRValidator.validate(context, {
    Directive: visitDirective,
    InlineFragment: visitInlineFragment,
    ConnectionField: visitField,
    LinkedField: visitField,
    ScalarField: visitField // FragmentSpread validation is done in RelayApplyFragmentArgumentTransform

  }, function (node) {
    return {
      rootNode: node,
      parentType: node.type
    };
  });
}

function visitDirective(node, _ref) {
  var parentType = _ref.parentType,
      rootNode = _ref.rootNode;
  var context = this.getContext();
  var directiveDef = context.serverSchema.getDirective(node.name);

  if (directiveDef == null) {
    return;
  }

  validateRequiredArguments(node, directiveDef.args, rootNode);
}

function visitInlineFragment(fragment, _ref2) {
  var rootNode = _ref2.rootNode;
  this.traverse(fragment, {
    rootNode: rootNode,
    parentType: fragment.typeCondition
  });
}

function visitField(node, _ref3) {
  var parentType = _ref3.parentType,
      rootNode = _ref3.rootNode;
  var context = this.getContext();
  var definition = getFieldDefinitionStrict(context.serverSchema, parentType, node.name);

  if (definition == null) {
    var isLegacyFatInterface = node.directives.some(function (directive) {
      return directive.name === 'fixme_fat_interface';
    });

    if (!isLegacyFatInterface) {
      throw createUserError("Unknown field '".concat(node.name, "' on type '").concat(String(parentType), "'."), [node.loc]);
    }
  } else {
    validateRequiredArguments(node, definition.args, rootNode);
  }

  this.traverse(node, {
    rootNode: rootNode,
    parentType: node.type
  });
}

function validateRequiredArguments(node, definitionArgs, rootNode) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    var _loop = function _loop() {
      var arg = _step.value;

      if (isRequiredArgument(arg) && !node.args.some(function (actualArg) {
        return actualArg.name === arg.name;
      })) {
        throw createUserError("Required argument '".concat(arg.name, ": ").concat(String(arg.type), "' is missing ") + "on '".concat(node.name, "' in '").concat(rootNode.name, "'."), [node.loc, rootNode.loc]);
      }
    };

    for (var _iterator = definitionArgs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      _loop();
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

module.exports = validateRelayRequiredArguments;