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

var CompilerContext = require("./GraphQLCompilerContext");

var IRTransformer = require("./GraphQLIRTransformer");

var getNormalizationOperationName = require("./getNormalizationOperationName");

/**
 * This transform creates a SplitOperation root for every ModuleImport.
 */
function relaySplitMatchTransform(context) {
  var splitOperations = new Map();
  var transformedContext = IRTransformer.transform(context, {
    LinkedField: visitLinkedField,
    InlineFragment: visitInlineFragment,
    ModuleImport: visitModuleImport
  }, function (node) {
    return {
      parentType: node.type,
      splitOperations: splitOperations
    };
  });
  return transformedContext.addAll(Array.from(splitOperations.values()));
}

function visitLinkedField(field, state) {
  return this.traverse(field, {
    parentType: field.type,
    splitOperations: state.splitOperations
  });
}

function visitInlineFragment(fragment, state) {
  return this.traverse(fragment, {
    parentType: fragment.typeCondition,
    splitOperations: state.splitOperations
  });
}

function visitModuleImport(node, state) {
  // It's possible for the same fragment to be selected in multiple usages
  // of @module: skip processing a node if its SplitOperation has already
  // been generated
  var normalizationName = getNormalizationOperationName(node.name);

  if (state.splitOperations.has(normalizationName)) {
    return node;
  }

  var transformedNode = this.traverse(node, state);
  var splitOperation = {
    kind: 'SplitOperation',
    name: normalizationName,
    selections: transformedNode.selections,
    loc: {
      kind: 'Derived',
      source: node.loc
    },
    metadata: {
      derivedFrom: transformedNode.name
    },
    type: state.parentType
  };
  state.splitOperations.set(normalizationName, splitOperation);
  return transformedNode;
}

module.exports = {
  transform: relaySplitMatchTransform
};