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

var invariant = require("fbjs/lib/invariant");

var _require = require("graphql"),
    GraphQLString = _require.GraphQLString;

var _require2 = require("relay-runtime"),
    getRelayHandleKey = _require2.getRelayHandleKey;

function relayFieldHandleTransform(context) {
  return IRTransformer.transform(context, {
    LinkedField: visitField,
    ScalarField: visitField
  });
}
/**
 * @internal
 */


function visitField(field) {
  if (field.kind === 'LinkedField') {
    field = this.traverse(field);
  }

  var handles = field.handles;

  if (!handles || !handles.length) {
    return field;
  } // ensure exactly one handle


  !(handles.length === 1) ? process.env.NODE_ENV !== "production" ? invariant(false, 'RelayFieldHandleTransform: Expected fields to have at most one ' + '"handle" property, got `%s`.', handles.join(', ')) : invariant(false) : void 0;
  var alias = field.alias;
  var handle = handles[0];
  var name = getRelayHandleKey(handle.name, handle.key, field.name);
  var filters = handle.filters;
  var args = filters ? field.args.filter(function (arg) {
    return filters.indexOf(arg.name) !== -1;
  }) : []; // T45504512: new connection model

  if (handle.dynamicKey != null) {
    args.push({
      kind: 'Argument',
      loc: handle.dynamicKey.loc,
      metadata: null,
      name: '__dynamicKey',
      type: GraphQLString,
      value: handle.dynamicKey
    });
  }

  return (0, _objectSpread2["default"])({}, field, {
    args: args,
    alias: alias,
    name: name,
    handles: null
  });
}

module.exports = {
  transform: relayFieldHandleTransform
};