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

var CompilerContext = require("./GraphQLCompilerContext");

var IRTransformer = require("./GraphQLIRTransformer");

var _require = require("./GraphQLSchemaUtils"),
    getNullableType = _require.getNullableType;

var _require2 = require("./RelayCompilerError"),
    createUserError = _require2.createUserError;

var _require3 = require("graphql"),
    GraphQLList = _require3.GraphQLList;

/**
 * This transform finds usages of @defer and @stream, validates them, and
 * converts the using node to specialized IR nodes (Defer/Stream).
 */
function relayDeferStreamTransform(context) {
  return IRTransformer.transform(context, {
    // TODO: type IRTransformer to allow changing result type
    FragmentSpread: visitFragmentSpread,
    // TODO: type IRTransformer to allow changing result type
    InlineFragment: visitInlineFragment,
    // TODO: type IRTransformer to allow changing result type
    LinkedField: visitLinkedField,
    ScalarField: visitScalarField
  }, function (sourceNode) {
    var labels = new Map();
    return {
      documentName: sourceNode.name,
      recordLabel: function recordLabel(label, directive) {
        var prevDirective = labels.get(label);

        if (prevDirective) {
          var _ref;

          var labelArg = directive.args.find(function (_ref5) {
            var name = _ref5.name;
            return name === 'label';
          });
          var prevLabelArg = prevDirective.args.find(function (_ref6) {
            var name = _ref6.name;
            return name === 'label';
          });
          var previousLocation = (_ref = prevLabelArg === null || prevLabelArg === void 0 ? void 0 : prevLabelArg.loc) !== null && _ref !== void 0 ? _ref : prevDirective.loc;

          if (labelArg) {
            throw createUserError("Invalid use of @".concat(directive.name, ", the provided label is ") + "not unique. Specify a unique 'label' as a literal string.", [labelArg === null || labelArg === void 0 ? void 0 : labelArg.loc, previousLocation]);
          } else {
            throw createUserError("Invalid use of @".concat(directive.name, ", could not generate a ") + "default label that is unique. Specify a unique 'label' " + 'as a literal string.', [directive.loc, previousLocation]);
          }
        }

        labels.set(label, directive);
      }
    };
  });
}

function visitLinkedField(field, state) {
  var _getLiteralStringArgu, _ref2;

  var transformedField = this.traverse(field, state);
  var streamDirective = transformedField.directives.find(function (directive) {
    return directive.name === 'stream';
  });

  if (streamDirective == null) {
    return transformedField;
  }

  var type = getNullableType(field.type);

  if (!(type instanceof GraphQLList)) {
    throw createUserError("Invalid use of @stream on non-plural field '".concat(field.name, "'"), [streamDirective.loc]);
  }

  transformedField = (0, _objectSpread2["default"])({}, transformedField, {
    directives: transformedField.directives.filter(function (directive) {
      return directive.name !== 'stream';
    })
  });
  var ifArg = streamDirective.args.find(function (arg) {
    return arg.name === 'if';
  });

  if (isLiteralFalse(ifArg)) {
    return transformedField;
  }

  var initialCount = streamDirective.args.find(function (arg) {
    return arg.name === 'initial_count';
  });

  if (initialCount == null) {
    throw createUserError("Invalid use of @stream, the 'initial_count' argument is required.", [streamDirective.loc]);
  }

  var label = (_getLiteralStringArgu = getLiteralStringArgument(streamDirective, 'label')) !== null && _getLiteralStringArgu !== void 0 ? _getLiteralStringArgu : field.alias;
  var transformedLabel = transformLabel(state.documentName, 'stream', label);
  state.recordLabel(transformedLabel, streamDirective);
  return {
    "if": (_ref2 = ifArg === null || ifArg === void 0 ? void 0 : ifArg.value) !== null && _ref2 !== void 0 ? _ref2 : null,
    initialCount: initialCount.value,
    kind: 'Stream',
    label: transformedLabel,
    loc: {
      kind: 'Derived',
      source: streamDirective.loc
    },
    metadata: null,
    selections: [transformedField]
  };
}

function visitScalarField(field, state) {
  var streamDirective = field.directives.find(function (directive) {
    return directive.name === 'stream';
  });

  if (streamDirective != null) {
    throw createUserError("Invalid use of @stream on scalar field '".concat(field.name, "'"), [streamDirective.loc]);
  }

  return this.traverse(field, state);
}

function visitInlineFragment(fragment, state) {
  var _getLiteralStringArgu2, _ref3;

  var transformedFragment = this.traverse(fragment, state);
  var deferDirective = transformedFragment.directives.find(function (directive) {
    return directive.name === 'defer';
  });

  if (deferDirective == null) {
    return transformedFragment;
  }

  transformedFragment = (0, _objectSpread2["default"])({}, transformedFragment, {
    directives: transformedFragment.directives.filter(function (directive) {
      return directive.name !== 'defer';
    })
  });
  var ifArg = deferDirective.args.find(function (arg) {
    return arg.name === 'if';
  });

  if (isLiteralFalse(ifArg)) {
    return transformedFragment;
  }

  var label = (_getLiteralStringArgu2 = getLiteralStringArgument(deferDirective, 'label')) !== null && _getLiteralStringArgu2 !== void 0 ? _getLiteralStringArgu2 : fragment.typeCondition.name;
  var transformedLabel = transformLabel(state.documentName, 'defer', label);
  state.recordLabel(transformedLabel, deferDirective);
  return {
    "if": (_ref3 = ifArg === null || ifArg === void 0 ? void 0 : ifArg.value) !== null && _ref3 !== void 0 ? _ref3 : null,
    kind: 'Defer',
    label: transformedLabel,
    loc: {
      kind: 'Derived',
      source: deferDirective.loc
    },
    metadata: {
      // We may lose this information during FlattenTransform
      // Keeping it on metadata will allow us to read it during IRPrinting step
      fragmentTypeCondition: transformedFragment.typeCondition
    },
    selections: [transformedFragment]
  };
}

function visitFragmentSpread(spread, state) {
  var _getLiteralStringArgu3, _ref4;

  var transformedSpread = this.traverse(spread, state);
  var deferDirective = transformedSpread.directives.find(function (directive) {
    return directive.name === 'defer';
  });

  if (deferDirective == null) {
    return transformedSpread;
  }

  transformedSpread = (0, _objectSpread2["default"])({}, transformedSpread, {
    directives: transformedSpread.directives.filter(function (directive) {
      return directive.name !== 'defer';
    })
  });
  var ifArg = deferDirective.args.find(function (arg) {
    return arg.name === 'if';
  });

  if (isLiteralFalse(ifArg)) {
    return transformedSpread;
  }

  var label = (_getLiteralStringArgu3 = getLiteralStringArgument(deferDirective, 'label')) !== null && _getLiteralStringArgu3 !== void 0 ? _getLiteralStringArgu3 : spread.name;
  var transformedLabel = transformLabel(state.documentName, 'defer', label);
  state.recordLabel(transformedLabel, deferDirective);
  return {
    "if": (_ref4 = ifArg === null || ifArg === void 0 ? void 0 : ifArg.value) !== null && _ref4 !== void 0 ? _ref4 : null,
    kind: 'Defer',
    label: transformedLabel,
    loc: {
      kind: 'Derived',
      source: deferDirective.loc
    },
    metadata: null,
    selections: [transformedSpread]
  };
}

function getLiteralStringArgument(directive, argName) {
  var arg = directive.args.find(function (_ref7) {
    var name = _ref7.name;
    return name === argName;
  });

  if (arg == null) {
    return null;
  }

  var value = arg.value.kind === 'Literal' ? arg.value.value : null;

  if (value == null || typeof value !== 'string') {
    throw createUserError("Expected the '".concat(argName, "' value to @").concat(directive.name, " to be a string literal if provided."), [arg.value.loc]);
  }

  return value;
}

function transformLabel(parentName, directive, label) {
  return "".concat(parentName, "$").concat(directive, "$").concat(label);
}

function isLiteralFalse(arg) {
  return arg != null && arg.value.kind === 'Literal' && arg.value.value === false;
}

module.exports = {
  transform: relayDeferStreamTransform
};