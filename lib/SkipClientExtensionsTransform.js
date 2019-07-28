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

var GraphQLCompilerContext = require("./GraphQLCompilerContext");

var GraphQLIRTransformer = require("./GraphQLIRTransformer");

function skipClientExtensionTransform(context) {
  return GraphQLIRTransformer.transform(context, {
    Fragment: visitFragment,
    ClientExtension: visitClientExtension
  });
}

function visitFragment(node) {
  var _this$getContext = this.getContext(),
      serverSchema = _this$getContext.serverSchema;

  if (serverSchema.getType(node.type.name)) {
    return this.traverse(node);
  }

  return null;
}

function visitClientExtension(node, state) {
  return null;
}

module.exports = {
  transform: skipClientExtensionTransform
};