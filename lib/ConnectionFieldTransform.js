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

var getLiteralArgumentValues = require("./getLiteralArgumentValues");

var _require = require("./GraphQLSchemaUtils"),
    getNullableType = _require.getNullableType;

var _require2 = require("./RelayCompilerError"),
    createUserError = _require2.createUserError;

var _require3 = require("graphql"),
    GraphQLList = _require3.GraphQLList;

var SCHEMA_EXTENSION = "\n  directive @connection_resolver(resolver: String!, label: String) on FIELD\n";

/**
 * This transform rewrites LinkedField nodes with @connection_resolver and rewrites them
 * into `ConnectionField` nodes.
 */
function connectionFieldTransform(context) {
  return IRTransformer.transform(context, {
    // TODO: type IRTransformer to allow changing result type
    LinkedField: visitLinkedField,
    ScalarField: visitScalarField
  }, function (node) {
    return {
      documentName: node.name,
      labels: new Map()
    };
  });
}

function visitLinkedField(field, state) {
  var _getLiteralStringArgu;

  var transformed = this.traverse(field, state);
  var connectionDirective = transformed.directives.find(function (directive) {
    return directive.name === 'connection_resolver';
  });

  if (connectionDirective == null) {
    return transformed;
  }

  if (getNullableType(transformed.type) instanceof GraphQLList) {
    throw createUserError("@connection_resolver fields must return a single value, not a list, found '" + "".concat(String(transformed.type), "'"), [transformed.loc]);
  }

  var _getLiteralArgumentVa = getLiteralArgumentValues(connectionDirective.args),
      resolver = _getLiteralArgumentVa.resolver;

  if (typeof resolver !== 'string') {
    var _ref;

    var resolverArg = transformed.args.find(function (arg) {
      return arg.name === 'resolver';
    });
    throw createUserError("Expected @connection_resolver field to specify a 'resolver' as a literal string. " + 'The resolver should be the name of a JS module to use at runtime ' + "to derive the field's value.", [(_ref = resolverArg === null || resolverArg === void 0 ? void 0 : resolverArg.loc) !== null && _ref !== void 0 ? _ref : connectionDirective.loc]);
  }

  var rawLabel = (_getLiteralStringArgu = getLiteralStringArgument(connectionDirective, 'label')) !== null && _getLiteralStringArgu !== void 0 ? _getLiteralStringArgu : transformed.alias;
  var label = transformLabel(state.documentName, 'connection', rawLabel);
  var previousDirective = state.labels.get(label);

  if (previousDirective != null) {
    var _ref2;

    var labelArg = connectionDirective.args.find(function (_ref3) {
      var name = _ref3.name;
      return name === 'label';
    });
    var prevLabelArg = previousDirective.args.find(function (_ref4) {
      var name = _ref4.name;
      return name === 'label';
    });
    var previousLocation = (_ref2 = prevLabelArg === null || prevLabelArg === void 0 ? void 0 : prevLabelArg.loc) !== null && _ref2 !== void 0 ? _ref2 : previousDirective.loc;

    if (labelArg) {
      throw createUserError('Invalid use of @connection_resolver, the provided label is ' + "not unique. Specify a unique 'label' as a literal string.", [labelArg === null || labelArg === void 0 ? void 0 : labelArg.loc, previousLocation]);
    } else {
      throw createUserError('Invalid use of @connection_resolver, could not generate a ' + "default label that is unique. Specify a unique 'label' " + 'as a literal string.', [connectionDirective.loc, previousLocation]);
    }
  }

  state.labels.set(label, connectionDirective);
  return {
    alias: transformed.alias,
    args: transformed.args,
    directives: transformed.directives.filter(function (directive) {
      return directive !== connectionDirective;
    }),
    kind: 'ConnectionField',
    label: label,
    loc: transformed.loc,
    metadata: transformed.metadata,
    name: transformed.name,
    resolver: resolver,
    selections: transformed.selections,
    type: transformed.type
  };
}

function visitScalarField(field) {
  var connectionDirective = field.directives.find(function (directive) {
    return directive.name === 'connection_resolver';
  });

  if (connectionDirective != null) {
    throw createUserError('The @connection_resolver direction is not supported on scalar fields, only fields returning an object/interface/union', [connectionDirective.loc]);
  }

  return field;
}

function getLiteralStringArgument(directive, argName) {
  var arg = directive.args.find(function (_ref5) {
    var name = _ref5.name;
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

module.exports = {
  SCHEMA_EXTENSION: SCHEMA_EXTENSION,
  transform: connectionFieldTransform
};