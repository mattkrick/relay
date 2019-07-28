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

/**
 * A transform that removes any directives that were not present in the
 * server schema.
 */
function filterDirectivesTransform(context) {
  var schemaDirectives = new Set(context.serverSchema.getDirectives().map(function (schemaDirective) {
    return schemaDirective.name;
  }));

  var visitDirective = function visitDirective(directive) {
    if (schemaDirectives.has(directive.name)) {
      return directive;
    }

    return null;
  };

  return GraphQLIRTransformer.transform(context, {
    Directive: visitDirective
  });
}

module.exports = {
  transform: filterDirectivesTransform
};