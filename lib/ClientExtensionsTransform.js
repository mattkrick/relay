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

var GraphQLIRTransformer = require("./GraphQLIRTransformer");

var _require = require("./GraphQLSchemaUtils"),
    getRawType = _require.getRawType,
    isClientDefinedField = _require.isClientDefinedField;

var _require2 = require("./RelayCompilerError"),
    createCompilerError = _require2.createCompilerError,
    createUserError = _require2.createUserError;

var cachesByNode = new Map();

function clientExtensionTransform(context) {
  cachesByNode = new Map();
  return GraphQLIRTransformer.transform(context, {
    Fragment: traverseDefinition,
    Root: traverseDefinition,
    SplitOperation: traverseDefinition
  });
}

function traverseDefinition(node) {
  var _serverSchema$getType;

  var compilerContext = this.getContext();
  var serverSchema = compilerContext.serverSchema,
      clientSchema = compilerContext.clientSchema;
  var rootType;

  switch (node.kind) {
    case 'Root':
      switch (node.operation) {
        case 'query':
          rootType = serverSchema.getQueryType();
          break;

        case 'mutation':
          rootType = serverSchema.getMutationType();
          break;

        case 'subscription':
          rootType = serverSchema.getSubscriptionType();
          break;

        default:
          node.operation;
      }

      break;

    case 'SplitOperation':
      rootType = serverSchema.getType(node.type.name);
      break;

    case 'Fragment':
      rootType = (_serverSchema$getType = serverSchema.getType(node.type.name)) !== null && _serverSchema$getType !== void 0 ? _serverSchema$getType : clientSchema.getType(node.type.name);
      break;

    default:
      node;
  }

  if (rootType == null) {
    throw createUserError("ClientExtensionTransform: Expected the type of `".concat(node.name, "` to have been defined in the schema. Make sure both server and ") + 'client schema are up to date.', [node.loc]);
  }

  return traverseSelections(node, compilerContext, rootType);
}

function traverseSelections(node, compilerContext, parentType) {
  var nodeCache = cachesByNode.get(node);

  if (nodeCache == null) {
    nodeCache = new Map();
    cachesByNode.set(node, nodeCache);
  }

  var result = nodeCache.get(parentType);

  if (result != null) {
    // $FlowFixMe - TODO: type IRTransformer to allow changing result type
    return result;
  }

  var serverSchema = compilerContext.serverSchema,
      clientSchema = compilerContext.clientSchema;
  var clientSelections = [];
  var serverSelections = [];
  node.selections.forEach(function (selection) {
    switch (selection.kind) {
      case 'ClientExtension':
        {
          serverSelections.push(selection);
          break;
        }

      case 'Condition':
      case 'Defer':
      case 'InlineDataFragmentSpread':
      case 'ModuleImport':
      case 'Stream':
        {
          var transformed = traverseSelections(selection, compilerContext, parentType);
          serverSelections.push(transformed);
          break;
        }

      case 'ConnectionField':
      case 'ScalarField':
      case 'LinkedField':
        {
          var isClientField = isClientDefinedField(selection, compilerContext, parentType);

          if (isClientField) {
            clientSelections.push(selection);
            break;
          }

          if (selection.kind === 'ScalarField') {
            serverSelections.push(selection);
          } else {
            var _serverSchema$getType2;

            var rawType = getRawType(selection.type);
            var fieldType = (_serverSchema$getType2 = serverSchema.getType(rawType.name)) !== null && _serverSchema$getType2 !== void 0 ? _serverSchema$getType2 : clientSchema.getType(rawType.name);

            if (fieldType == null) {
              throw createCompilerError('ClientExtensionTransform: Expected to be able to determine ' + "type of field `".concat(selection.name, "`."), [selection.loc]);
            }

            var _transformed = traverseSelections(selection, compilerContext, fieldType);

            serverSelections.push(_transformed);
          }

          break;
        }

      case 'InlineFragment':
        {
          var typeName = selection.typeCondition.name;
          var serverType = serverSchema.getType(typeName);
          var clientType = clientSchema.getType(typeName);
          var isClientType = serverType == null && clientType != null;

          if (isClientType) {
            clientSelections.push(selection);
          } else {
            var _serverType;

            var type = (_serverType = serverType) !== null && _serverType !== void 0 ? _serverType : clientType;

            if (type == null) {
              throw createCompilerError('ClientExtensionTransform: Expected to be able to determine ' + "type of inline fragment on `".concat(typeName, "`."), [selection.loc]);
            }

            var _transformed2 = traverseSelections(selection, compilerContext, type);

            serverSelections.push(_transformed2);
          }

          break;
        }

      case 'FragmentSpread':
        {
          if (!compilerContext.get(selection.name)) {
            // NOTE: Calling `get` will check if the fragment definition for this
            // fragment spread exists. If it doesn't, which can happen if the
            // fragment spread is referencing a fragment defined with Relay Classic,
            // we will treat this selection as a client-only selection
            // This will ensure that it is properly skipped for the print context.
            clientSelections.push(selection);
            break;
          }

          var fragment = compilerContext.getFragment(selection.name, selection.loc);
          var _typeName = fragment.type.name;

          var _serverType2 = serverSchema.getType(_typeName);

          var _clientType = clientSchema.getType(_typeName);

          var _isClientType = _serverType2 == null && _clientType != null;

          if (_isClientType) {
            clientSelections.push(selection);
          } else {
            serverSelections.push(selection);
          }

          break;
        }

      default:
        selection;
        throw createCompilerError("ClientExtensionTransform: Unexpected selection of kind `".concat(selection.kind, "`."), [selection.loc]);
    }
  });
  result = clientSelections.length === 0 ? (0, _objectSpread2["default"])({}, node, {
    selections: [].concat(serverSelections)
  }) : (0, _objectSpread2["default"])({}, node, {
    selections: [].concat(serverSelections, [// Group client fields under a single ClientExtension node
    {
      kind: 'ClientExtension',
      loc: node.loc,
      metadata: null,
      selections: [].concat(clientSelections)
    }])
  });
  nodeCache.set(parentType, result); // $FlowFixMe - TODO: type IRTransformer to allow changing result type

  return result;
}

module.exports = {
  transform: clientExtensionTransform
};