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
  if (node == null) {
    return node;
  }

  var metadata = null;

  if (node.metadata != null) {
    var _node$metadata = node.metadata,
        mask = _node$metadata.mask,
        plural = _node$metadata.plural,
        connection = _node$metadata.connection,
        refetch = _node$metadata.refetch;

    if (Array.isArray(connection)) {
      var _metadata;

      metadata = (_metadata = metadata) !== null && _metadata !== void 0 ? _metadata : {};
      metadata.connection = connection;
    }

    if (typeof mask === 'boolean') {
      var _metadata2;

      metadata = (_metadata2 = metadata) !== null && _metadata2 !== void 0 ? _metadata2 : {};
      metadata.mask = mask;
    }

    if (typeof plural === 'boolean') {
      var _metadata3;

      metadata = (_metadata3 = metadata) !== null && _metadata3 !== void 0 ? _metadata3 : {};
      metadata.plural = plural;
    }

    if (typeof refetch === 'object') {
      var _metadata4;

      metadata = (_metadata4 = metadata) !== null && _metadata4 !== void 0 ? _metadata4 : {};
      metadata.refetch = {
        // $FlowFixMe
        connection: refetch.connection,
        // $FlowFixMe
        operation: CodeMarker.moduleDependency(refetch.operation + '.graphql'),
        // $FlowFixMe
        fragmentPathInResult: refetch.fragmentPathInResult
      };
    }
  }

  return {
    kind: 'Fragment',
    name: node.name,
    type: node.type.toString(),
    // $FlowFixMe
    metadata: metadata,
    argumentDefinitions: generateArgumentDefinitions(node.argumentDefinitions),
    selections: generateSelections(node.selections)
  };
}

function generateSelections(selections) {
  return selections.map(function (selection) {
    switch (selection.kind) {
      case 'ClientExtension':
        return generateClientExtension(selection);

      case 'FragmentSpread':
        return generateFragmentSpread(selection);

      case 'Condition':
        return generateCondition(selection);

      case 'ScalarField':
        return generateScalarField(selection);

      case 'ModuleImport':
        return generateModuleImport(selection);

      case 'InlineDataFragmentSpread':
        return generateInlineDataFragmentSpread(selection);

      case 'InlineFragment':
        return generateInlineFragment(selection);

      case 'LinkedField':
        return generateLinkedField(selection);

      case 'ConnectionField':
        return generateConnectionField(selection);

      case 'Defer':
      case 'Stream':
        throw createCompilerError("Unexpected ".concat(selection.kind, " IR node in ReaderCodeGenerator."), [selection.loc]);

      default:
        selection;
        throw new Error();
    }
  }).filter(Boolean);
}

function generateArgumentDefinitions(nodes) {
  return nodes.map(function (node) {
    switch (node.kind) {
      case 'LocalArgumentDefinition':
        return {
          kind: 'LocalArgument',
          name: node.name,
          type: node.type.toString(),
          defaultValue: node.defaultValue
        };

      case 'RootArgumentDefinition':
        return {
          kind: 'RootArgument',
          name: node.name,
          type: node.type ? node.type.toString() : null
        };

      default:
        node;
        throw new Error();
    }
  });
}

function generateClientExtension(node) {
  return {
    kind: 'ClientExtension',
    selections: generateSelections(node.selections)
  };
}

function generateCondition(node) {
  if (node.condition.kind !== 'Variable') {
    throw createCompilerError("ReaderCodeGenerator: Expected 'Condition' with static value to be " + 'pruned or inlined', [node.condition.loc]);
  }

  return {
    kind: 'Condition',
    passingValue: node.passingValue,
    condition: node.condition.variableName,
    selections: generateSelections(node.selections)
  };
}

function generateFragmentSpread(node) {
  return {
    kind: 'FragmentSpread',
    name: node.name,
    args: generateArgs(node.args)
  };
}

function generateInlineFragment(node) {
  return {
    kind: 'InlineFragment',
    type: node.typeCondition.toString(),
    selections: generateSelections(node.selections)
  };
}

function generateInlineDataFragmentSpread(node) {
  return {
    kind: 'InlineDataFragmentSpread',
    name: node.name,
    selections: generateSelections(node.selections)
  };
}

function generateLinkedField(node) {
  // Note: it is important that the arguments of this field be sorted to
  // ensure stable generation of storage keys for equivalent arguments
  // which may have originally appeared in different orders across an app.
  // TODO(T37646905) enable this invariant after splitting the
  // RelayCodeGenerator-test and running the RelayFieldHandleTransform on
  // Reader ASTs.
  //
  //   invariant(
  //     node.handles == null,
  //     'ReaderCodeGenerator: unexpected handles',
  //   );
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

  return field;
}

function generateConnectionField(node) {
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

function generateModuleImport(node) {
  var fragmentName = node.name;
  var regExpMatch = fragmentName.match(/^([a-zA-Z][a-zA-Z0-9]*)(?:_([a-zA-Z][_a-zA-Z0-9]*))?$/);

  if (!regExpMatch) {
    throw createCompilerError('ReaderCodeGenerator: @match fragments should be named ' + "'FragmentName_propName', got '".concat(fragmentName, "'."), [node.loc]);
  }

  var fragmentPropName = regExpMatch[2];

  if (typeof fragmentPropName !== 'string') {
    throw createCompilerError('ReaderCodeGenerator: @module fragments should be named ' + "'FragmentName_propName', got '".concat(fragmentName, "'."), [node.loc]);
  }

  return {
    kind: 'ModuleImport',
    documentName: node.documentName,
    fragmentName: fragmentName,
    fragmentPropName: fragmentPropName
  };
}

function generateScalarField(node) {
  // Note: it is important that the arguments of this field be sorted to
  // ensure stable generation of storage keys for equivalent arguments
  // which may have originally appeared in different orders across an app.
  // TODO(T37646905) enable this invariant after splitting the
  // RelayCodeGenerator-test and running the RelayFieldHandleTransform on
  // Reader ASTs.
  //
  //   invariant(
  //     node.handles == null,
  //     'ReaderCodeGenerator: unexpected handles',
  //   );
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

  return field;
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
      throw createUserError('ReaderCodeGenerator: Complex argument values (Lists or ' + 'InputObjects with nested variables) are not supported.', [node.value.loc]);
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