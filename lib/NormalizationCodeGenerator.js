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

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var CodeMarker = require("./CodeMarker");

var SchemaUtils = require("./GraphQLSchemaUtils");

var _require = require("./RelayCompilerError"),
    createCompilerError = _require.createCompilerError,
    createUserError = _require.createUserError;

var _require2 = require("graphql"),
    GraphQLList = _require2.GraphQLList;

var _require3 = require("relay-runtime"),
    getStorageKey = _require3.getStorageKey,
    stableCopy = _require3.stableCopy;

var getRawType = SchemaUtils.getRawType,
    isAbstractType = SchemaUtils.isAbstractType,
    getNullableType = SchemaUtils.getNullableType;
/**
 * @public
 *
 * Converts a GraphQLIR node into a plain JS object representation that can be
 * used at runtime.
 */

function generate(node) {
  switch (node.kind) {
    case 'Root':
      return generateRoot(node);

    case 'SplitOperation':
      return generateSplitOperation(node);

    default:
      throw createCompilerError("NormalizationCodeGenerator: Unsupported AST kind '".concat(node.kind, "'."), [node.loc]);
  }
}

function generateRoot(node) {
  return {
    kind: 'Operation',
    name: node.name,
    argumentDefinitions: generateArgumentDefinitions(node.argumentDefinitions),
    selections: generateSelections(node.selections)
  };
}

function generateSplitOperation(node, key) {
  return {
    kind: 'SplitOperation',
    name: node.name,
    metadata: node.metadata,
    selections: generateSelections(node.selections)
  };
}

function generateSelections(selections) {
  var normalizationSelections = [];
  selections.forEach(function (selection) {
    switch (selection.kind) {
      case 'Condition':
        normalizationSelections.push(generateCondition(selection));
        break;

      case 'ClientExtension':
        normalizationSelections.push(generateClientExtension(selection));
        break;

      case 'ScalarField':
        normalizationSelections.push.apply(normalizationSelections, (0, _toConsumableArray2["default"])(generateScalarField(selection)));
        break;

      case 'ModuleImport':
        normalizationSelections.push(generateModuleImport(selection));
        break;

      case 'InlineFragment':
        normalizationSelections.push(generateInlineFragment(selection));
        break;

      case 'LinkedField':
        normalizationSelections.push.apply(normalizationSelections, (0, _toConsumableArray2["default"])(generateLinkedField(selection)));
        break;

      case 'ConnectionField':
        normalizationSelections.push(generateConnectionField(selection));
        break;

      case 'Defer':
        normalizationSelections.push(generateDefer(selection));
        break;

      case 'Stream':
        normalizationSelections.push(generateStream(selection));
        break;

      case 'InlineDataFragmentSpread':
      case 'FragmentSpread':
        throw new createCompilerError("NormalizationCodeGenerator: Unexpected IR node ".concat(selection.kind, "."), [selection.loc]);

      default:
        selection;
        throw new Error();
    }
  });
  return normalizationSelections;
}

function generateArgumentDefinitions(nodes) {
  return nodes.map(function (node) {
    return {
      kind: 'LocalArgument',
      name: node.name,
      type: node.type.toString(),
      defaultValue: node.defaultValue
    };
  });
}

function generateClientExtension(node) {
  return {
    kind: 'ClientExtension',
    selections: generateSelections(node.selections)
  };
}

function generateCondition(node, key) {
  if (node.condition.kind !== 'Variable') {
    throw createCompilerError("NormalizationCodeGenerator: Expected 'Condition' with static " + 'value to be pruned or inlined', [node.condition.loc]);
  }

  return {
    kind: 'Condition',
    passingValue: node.passingValue,
    condition: node.condition.variableName,
    selections: generateSelections(node.selections)
  };
}

function generateDefer(node, key) {
  if (!(node["if"] == null || node["if"].kind === 'Variable' || node["if"].kind === 'Literal' && node["if"].value === true)) {
    var _ref, _node$if;

    throw createCompilerError('NormalizationCodeGenerator: Expected @defer `if` condition to be ' + 'a variable, unspecified, or the literal `true`.', [(_ref = (_node$if = node["if"]) === null || _node$if === void 0 ? void 0 : _node$if.loc) !== null && _ref !== void 0 ? _ref : node.loc]);
  }

  return {
    "if": node["if"] != null && node["if"].kind === 'Variable' ? node["if"].variableName : null,
    kind: 'Defer',
    label: node.label,
    metadata: node.metadata,
    selections: generateSelections(node.selections)
  };
}

function generateInlineFragment(node) {
  return {
    kind: 'InlineFragment',
    type: node.typeCondition.toString(),
    selections: generateSelections(node.selections)
  };
}

function generateLinkedField(node) {
  // Note: it is important that the arguments of this field be sorted to
  // ensure stable generation of storage keys for equivalent arguments
  // which may have originally appeared in different orders across an app.
  var handles = node.handles && node.handles.map(function (handle) {
    var handleNode = {
      kind: 'LinkedHandle',
      alias: node.alias === node.name ? null : node.alias,
      name: node.name,
      args: generateArgs(node.args),
      handle: handle.name,
      key: handle.key,
      filters: handle.filters
    }; // T45504512: new connection model
    // NOTE: this intentionally adds a dynamic key in order to avoid
    // triggering updates to existing queries that do not use dynamic
    // keys.

    if (handle.dynamicKey != null) {
      var dynamicKeyArgName = '__dynamicKey';
      handleNode = (0, _objectSpread2["default"])({}, handleNode, {
        dynamicKey: {
          kind: 'Variable',
          name: dynamicKeyArgName,
          variableName: handle.dynamicKey.variableName
        }
      });
    }

    return handleNode;
  }) || [];
  var type = getRawType(node.type);
  var field = {
    kind: 'LinkedField',
    alias: node.alias === node.name ? null : node.alias,
    name: node.name,
    storageKey: null,
    args: generateArgs(node.args),
    concreteType: !isAbstractType(type) ? type.toString() : null,
    plural: isPlural(node.type),
    selections: generateSelections(node.selections)
  }; // Precompute storageKey if possible

  var storageKey = getStaticStorageKey(field, node.metadata);

  if (storageKey) {
    field = (0, _objectSpread2["default"])({}, field, {
      storageKey: storageKey
    });
  }

  return [field].concat(handles);
}

function generateConnectionField(node) {
  // TODO
  var type = getRawType(node.type);

  if (isPlural(node.type)) {
    throw createUserError('Connection fields cannot return a plural (list) value.', [node.loc]);
  }

  var field = {
    kind: 'ConnectionField',
    alias: node.alias === node.name ? null : node.alias,
    label: node.label,
    name: node.name,
    resolver: CodeMarker.moduleDependency(node.resolver),
    storageKey: null,
    args: generateArgs(node.args),
    concreteType: !isAbstractType(type) ? type.toString() : null,
    selections: generateSelections(node.selections)
  }; // Precompute storageKey if possible

  var storageKey = getStaticStorageKey(field, node.metadata);

  if (storageKey) {
    field = (0, _objectSpread2["default"])({}, field, {
      storageKey: storageKey
    });
  }

  return field;
}

function generateModuleImport(node, key) {
  var fragmentName = node.name;
  var regExpMatch = fragmentName.match(/^([a-zA-Z][a-zA-Z0-9]*)(?:_([a-zA-Z][_a-zA-Z0-9]*))?$/);

  if (!regExpMatch) {
    throw createCompilerError('NormalizationCodeGenerator: @module fragments should be named ' + "'FragmentName_propName', got '".concat(fragmentName, "'."), [node.loc]);
  }

  var fragmentPropName = regExpMatch[2];

  if (typeof fragmentPropName !== 'string') {
    throw createCompilerError('NormalizationCodeGenerator: @module fragments should be named ' + "'FragmentName_propName', got '".concat(fragmentName, "'."), [node.loc]);
  }

  return {
    kind: 'ModuleImport',
    documentName: node.documentName,
    fragmentName: fragmentName,
    fragmentPropName: fragmentPropName
  };
}

function generateScalarField(node) {
  var _node$metadata;

  if ((_node$metadata = node.metadata) === null || _node$metadata === void 0 ? void 0 : _node$metadata.skipNormalizationNode) {
    return [];
  } // Note: it is important that the arguments of this field be sorted to
  // ensure stable generation of storage keys for equivalent arguments
  // which may have originally appeared in different orders across an app.


  var handles = node.handles && node.handles.map(function (handle) {
    if (handle.dynamicKey != null) {
      throw createUserError('Dynamic key values are not supported on scalar fields.', [handle.dynamicKey.loc]);
    }

    return {
      kind: 'ScalarHandle',
      alias: node.alias === node.name ? null : node.alias,
      name: node.name,
      args: generateArgs(node.args),
      handle: handle.name,
      key: handle.key,
      filters: handle.filters
    };
  }) || [];
  var field = {
    kind: 'ScalarField',
    alias: node.alias === node.name ? null : node.alias,
    name: node.name,
    args: generateArgs(node.args),
    storageKey: null
  }; // Precompute storageKey if possible

  var storageKey = getStaticStorageKey(field, node.metadata);

  if (storageKey) {
    field = (0, _objectSpread2["default"])({}, field, {
      storageKey: storageKey
    });
  }

  return [field].concat(handles);
}

function generateStream(node, key) {
  if (!(node["if"] == null || node["if"].kind === 'Variable' || node["if"].kind === 'Literal' && node["if"].value === true)) {
    var _ref2, _node$if2;

    throw createCompilerError('NormalizationCodeGenerator: Expected @stream `if` condition to be ' + 'a variable, unspecified, or the literal `true`.', [(_ref2 = (_node$if2 = node["if"]) === null || _node$if2 === void 0 ? void 0 : _node$if2.loc) !== null && _ref2 !== void 0 ? _ref2 : node.loc]);
  }

  return {
    "if": node["if"] != null && node["if"].kind === 'Variable' ? node["if"].variableName : null,
    kind: 'Stream',
    label: node.label,
    metadata: node.metadata,
    selections: generateSelections(node.selections)
  };
}

function generateArgument(node) {
  var value = node.value;

  switch (value.kind) {
    case 'Variable':
      return {
        kind: 'Variable',
        name: node.name,
        variableName: value.variableName
      };

    case 'Literal':
      return value.value === null ? null : {
        kind: 'Literal',
        name: node.name,
        value: stableCopy(value.value)
      };

    default:
      throw createUserError('NormalizationCodeGenerator: Complex argument values (Lists or ' + 'InputObjects with nested variables) are not supported.', [node.value.loc]);
  }
}

function isPlural(type) {
  return getNullableType(type) instanceof GraphQLList;
}

function generateArgs(args) {
  var concreteArguments = [];
  args.forEach(function (arg) {
    var concreteArgument = generateArgument(arg);

    if (concreteArgument !== null) {
      concreteArguments.push(concreteArgument);
    }
  });
  return concreteArguments.length === 0 ? null : concreteArguments.sort(nameComparator);
}

function nameComparator(a, b) {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}
/**
 * Pre-computes storage key if possible and advantageous. Storage keys are
 * generated for fields with supplied arguments that are all statically known
 * (ie. literals, no variables) at build time.
 */


function getStaticStorageKey(field, metadata) {
  var metadataStorageKey = metadata === null || metadata === void 0 ? void 0 : metadata.storageKey;

  if (typeof metadataStorageKey === 'string') {
    return metadataStorageKey;
  }

  if (!field.args || field.args.length === 0 || field.args.some(function (arg) {
    return arg.kind !== 'Literal';
  })) {
    return null;
  }

  return getStorageKey(field, {});
}

module.exports = {
  generate: generate
};