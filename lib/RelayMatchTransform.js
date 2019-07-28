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

var CompilerContext = require("./GraphQLCompilerContext");

var IRTransformer = require("./GraphQLIRTransformer");

var getLiteralArgumentValues = require("./getLiteralArgumentValues");

var getNormalizationOperationName = require("./getNormalizationOperationName");

var _require = require("./GraphQLSchemaUtils"),
    getRawType = _require.getRawType;

var _require2 = require("./RelayCompilerError"),
    createUserError = _require2.createUserError;

var _require3 = require("graphql"),
    assertObjectType = _require3.assertObjectType,
    isObjectType = _require3.isObjectType,
    GraphQLObjectType = _require3.GraphQLObjectType,
    GraphQLScalarType = _require3.GraphQLScalarType,
    GraphQLInterfaceType = _require3.GraphQLInterfaceType,
    GraphQLUnionType = _require3.GraphQLUnionType,
    GraphQLList = _require3.GraphQLList,
    GraphQLString = _require3.GraphQLString,
    getNullableType = _require3.getNullableType;

var _require4 = require("relay-runtime"),
    getModuleComponentKey = _require4.getModuleComponentKey,
    getModuleOperationKey = _require4.getModuleOperationKey;

var SUPPORTED_ARGUMENT_NAME = 'supported';
var JS_FIELD_TYPE = 'JSDependency';
var JS_FIELD_MODULE_ARG = 'module';
var JS_FIELD_ID_ARG = 'id';
var JS_FIELD_NAME = 'js';
var SCHEMA_EXTENSION = "\n  directive @match on FIELD\n\n  directive @module(\n    name: String!\n  ) on FRAGMENT_SPREAD\n";

/**
 * This transform rewrites LinkedField nodes with @match and rewrites them
 * into `LinkedField` nodes with a `supported` argument.
 */
function relayMatchTransform(context) {
  return IRTransformer.transform(context, {
    // TODO: type IRTransformer to allow changing result type
    FragmentSpread: visitFragmentSpread,
    LinkedField: visitLinkedField,
    InlineFragment: visitInlineFragment,
    ScalarField: visitScalarField
  }, function (node) {
    return {
      documentName: node.name,
      parentType: node.type,
      path: []
    };
  });
}

function visitInlineFragment(node, state) {
  return this.traverse(node, (0, _objectSpread2["default"])({}, state, {
    parentType: node.typeCondition
  }));
}

function visitScalarField(field) {
  if (field.name === JS_FIELD_NAME) {
    var context = this.getContext();
    var schema = context.serverSchema;
    var jsModuleType = schema.getType(JS_FIELD_TYPE);

    if (jsModuleType != null && jsModuleType instanceof GraphQLScalarType && getRawType(field.type).name === jsModuleType.name) {
      throw new createUserError("Direct use of the '".concat(JS_FIELD_NAME, "' field is not allowed, use ") + '@match/@module instead.', [field.loc]);
    }
  }

  return field;
}

function visitLinkedField(node, state) {
  state.path.push(node.alias);
  var transformedNode = this.traverse(node, (0, _objectSpread2["default"])({}, state, {
    parentType: node.type
  }));
  state.path.pop();
  var matchDirective = transformedNode.directives.find(function (directive) {
    return directive.name === 'match';
  });

  if (matchDirective == null) {
    return transformedNode;
  }

  var parentType = state.parentType;
  var rawType = getRawType(parentType);

  if (!(rawType instanceof GraphQLInterfaceType || rawType instanceof GraphQLObjectType)) {
    throw createUserError("@match used on incompatible field '".concat(transformedNode.name, "'.") + '@match may only be used with fields whose parent type is an ' + "interface or object, got invalid type '".concat(String(parentType), "'."), [node.loc]);
  }

  var context = this.getContext();
  var currentField = rawType.getFields()[transformedNode.name];
  var supportedArgumentDefinition = currentField.args.find(function (_ref4) {
    var name = _ref4.name;
    return name === SUPPORTED_ARGUMENT_NAME;
  });
  var supportedArgType = supportedArgumentDefinition != null ? getNullableType(supportedArgumentDefinition.type) : null;
  var supportedArgOfType = supportedArgType != null && supportedArgType instanceof GraphQLList ? supportedArgType.ofType : null;

  if (supportedArgumentDefinition == null || supportedArgType == null || supportedArgOfType == null || getNullableType(supportedArgOfType) !== GraphQLString) {
    throw createUserError("@match used on incompatible field '".concat(transformedNode.name, "'. ") + '@match may only be used with fields that accept a ' + "'supported: [String!]!' argument.", [node.loc]);
  }

  var rawFieldType = getRawType(transformedNode.type);

  if (!(rawFieldType instanceof GraphQLUnionType) && !(rawFieldType instanceof GraphQLInterfaceType)) {
    throw createUserError("@match used on incompatible field '".concat(transformedNode.name, "'.") + '@match may only be used with fields that return a union or interface.', [node.loc]);
  }

  var seenTypes = new Map();
  var selections = [];
  transformedNode.selections.forEach(function (matchSelection) {
    var moduleImport = matchSelection.kind === 'InlineFragment' ? matchSelection.selections[0] : null;

    if (matchSelection.kind !== 'InlineFragment' || moduleImport == null || moduleImport.kind !== 'ModuleImport') {
      throw createUserError('Invalid @match selection: all selections should be ' + 'fragment spreads with @module.', [matchSelection.loc, moduleImport === null || moduleImport === void 0 ? void 0 : moduleImport.loc].filter(Boolean));
    }

    var matchedType = matchSelection.typeCondition;
    var previousTypeUsage = seenTypes.get(matchedType);

    if (previousTypeUsage) {
      throw createUserError('Invalid @match selection: each concrete variant/implementor of ' + "'".concat(String(rawFieldType), "' may be matched against at-most once, ") + "but '".concat(String(matchedType), "' was matched against multiple times."), [matchSelection.loc, previousTypeUsage.loc]);
    }

    seenTypes.set(matchedType, matchSelection);
    var possibleConcreteTypes = rawFieldType instanceof GraphQLUnionType ? rawFieldType.getTypes() : context.serverSchema.getPossibleTypes(rawFieldType);
    var isPossibleConcreteType = possibleConcreteTypes.some(function (type) {
      return type.name === matchedType.name;
    });

    if (!isPossibleConcreteType) {
      var suggestedTypesMessage = 'but no concrete types are defined.';

      if (possibleConcreteTypes.length !== 0) {
        suggestedTypesMessage = "expected one of ".concat(possibleConcreteTypes.slice(0, 3).map(function (type) {
          return "'".concat(String(type), "'");
        }).join(', '), ", etc.");
      }

      throw createUserError('Invalid @match selection: selections must match against concrete ' + 'variants/implementors of type ' + "'".concat(String(transformedNode.type), "'. Got '").concat(String(matchedType), "', ") + suggestedTypesMessage, [matchSelection.loc, context.getFragment(moduleImport.name).loc]);
    }

    selections.push(matchSelection);
  });
  var supportedArg = transformedNode.args.find(function (arg) {
    return arg.name === SUPPORTED_ARGUMENT_NAME;
  });

  if (supportedArg != null) {
    throw createUserError("Invalid @match selection: the '".concat(SUPPORTED_ARGUMENT_NAME, "' argument ") + 'is automatically added and cannot be supplied explicitly.', [supportedArg.loc]);
  }

  return {
    kind: 'LinkedField',
    alias: transformedNode.alias,
    args: [].concat((0, _toConsumableArray2["default"])(transformedNode.args), [{
      kind: 'Argument',
      name: SUPPORTED_ARGUMENT_NAME,
      type: supportedArgumentDefinition.type,
      value: {
        kind: 'Literal',
        loc: node.loc,
        metadata: {},
        value: Array.from(seenTypes.keys()).map(function (type) {
          return type.name;
        })
      },
      loc: node.loc,
      metadata: {}
    }]),
    directives: [],
    handles: null,
    loc: node.loc,
    metadata: null,
    name: transformedNode.name,
    type: transformedNode.type,
    selections: selections
  };
} // Transform @module


function visitFragmentSpread(spread, _ref5) {
  var _ref, _moduleDirective$args2, _ref2, _moduleDirective$args3, _ref3, _moduleDirective$args4;

  var documentName = _ref5.documentName,
      path = _ref5.path;
  var transformedNode = this.traverse(spread);
  var moduleDirective = transformedNode.directives.find(function (directive) {
    return directive.name === 'module';
  });

  if (moduleDirective == null) {
    return transformedNode;
  }

  if (spread.args.length !== 0) {
    var _spread$args$;

    throw createUserError('@module does not support @arguments.', [(_spread$args$ = spread.args[0]) === null || _spread$args$ === void 0 ? void 0 : _spread$args$.loc].filter(Boolean));
  }

  var context = this.getContext();
  var schema = context.serverSchema;
  var jsModuleType = schema.getType(JS_FIELD_TYPE);

  if (jsModuleType == null || !(jsModuleType instanceof GraphQLScalarType)) {
    throw createUserError('Using @module requires the schema to define a scalar ' + "'".concat(JS_FIELD_TYPE, "' type."));
  }

  var fragment = context.getFragment(spread.name, spread.loc);

  if (!isObjectType(fragment.type)) {
    throw createUserError("@module used on invalid fragment spread '...".concat(spread.name, "'. @module ") + 'may only be used with fragments on a concrete (object) type, ' + "but the fragment has abstract type '".concat(String(fragment.type), "'."), [spread.loc, fragment.loc]);
  }

  var type = assertObjectType(fragment.type);
  var jsField = type.getFields()[JS_FIELD_NAME];
  var jsFieldModuleArg = jsField ? jsField.args.find(function (arg) {
    return arg.name === JS_FIELD_MODULE_ARG;
  }) : null;
  var jsFieldIdArg = jsField ? jsField.args.find(function (arg) {
    return arg.name === JS_FIELD_ID_ARG;
  }) : null;

  if (jsField == null || jsFieldModuleArg == null || getNullableType(jsFieldModuleArg.type) !== GraphQLString || jsFieldIdArg != null && getNullableType(jsFieldIdArg.type) !== GraphQLString || jsField.type.name !== jsModuleType.name // object identity fails in tests
  ) {
      throw createUserError("@module used on invalid fragment spread '...".concat(spread.name, "'. @module ") + "requires the fragment type '".concat(String(fragment.type), "' to have a ") + "'".concat(JS_FIELD_NAME, "(").concat(JS_FIELD_MODULE_ARG, ": String! ") + "[".concat(JS_FIELD_ID_ARG, ": String]): ").concat(JS_FIELD_TYPE, "' field (your ") + "schema may choose to omit the 'id'  argument but if present it " + "must accept a 'String').", [moduleDirective.loc]);
    }

  if (spread.directives.length !== 1) {
    throw createUserError("@module used on invalid fragment spread '...".concat(spread.name, "'. @module ") + 'may not have additional directives.', [spread.loc]);
  }

  var _getLiteralArgumentVa = getLiteralArgumentValues(moduleDirective.args),
      moduleName = _getLiteralArgumentVa.name;

  if (typeof moduleName !== 'string') {
    var _moduleDirective$args;

    throw createUserError("Expected the 'name' argument of @module to be a literal string", [((_moduleDirective$args = moduleDirective.args.find(function (arg) {
      return arg.name === 'name';
    })) !== null && _moduleDirective$args !== void 0 ? _moduleDirective$args : spread).loc]);
  }

  var moduleId = [documentName].concat((0, _toConsumableArray2["default"])(path)).join('.');
  var normalizationName = getNormalizationOperationName(spread.name) + '.graphql';
  var componentKey = getModuleComponentKey(documentName);
  var componentField = {
    alias: componentKey,
    args: [{
      kind: 'Argument',
      name: JS_FIELD_MODULE_ARG,
      type: jsFieldModuleArg.type,
      value: {
        kind: 'Literal',
        loc: (_ref = (_moduleDirective$args2 = moduleDirective.args[0]) === null || _moduleDirective$args2 === void 0 ? void 0 : _moduleDirective$args2.loc) !== null && _ref !== void 0 ? _ref : moduleDirective.loc,
        metadata: {},
        value: moduleName
      },
      loc: moduleDirective.loc,
      metadata: {}
    }, jsFieldIdArg != null ? {
      kind: 'Argument',
      name: JS_FIELD_ID_ARG,
      type: jsFieldIdArg.type,
      value: {
        kind: 'Literal',
        loc: (_ref2 = (_moduleDirective$args3 = moduleDirective.args[0]) === null || _moduleDirective$args3 === void 0 ? void 0 : _moduleDirective$args3.loc) !== null && _ref2 !== void 0 ? _ref2 : moduleDirective.loc,
        metadata: {},
        value: moduleId
      },
      loc: moduleDirective.loc,
      metadata: {}
    } : null].filter(Boolean),
    directives: [],
    handles: null,
    kind: 'ScalarField',
    loc: moduleDirective.loc,
    metadata: {
      skipNormalizationNode: true
    },
    name: JS_FIELD_NAME,
    type: jsModuleType
  };
  var operationKey = getModuleOperationKey(documentName);
  var operationField = {
    alias: operationKey,
    args: [{
      kind: 'Argument',
      name: JS_FIELD_MODULE_ARG,
      type: jsFieldModuleArg.type,
      value: {
        kind: 'Literal',
        loc: moduleDirective.loc,
        metadata: {},
        value: normalizationName
      },
      loc: moduleDirective.loc,
      metadata: {}
    }, jsFieldIdArg != null ? {
      kind: 'Argument',
      name: JS_FIELD_ID_ARG,
      type: jsFieldIdArg.type,
      value: {
        kind: 'Literal',
        loc: (_ref3 = (_moduleDirective$args4 = moduleDirective.args[0]) === null || _moduleDirective$args4 === void 0 ? void 0 : _moduleDirective$args4.loc) !== null && _ref3 !== void 0 ? _ref3 : moduleDirective.loc,
        metadata: {},
        value: moduleId
      },
      loc: moduleDirective.loc,
      metadata: {}
    } : null].filter(Boolean),
    directives: [],
    handles: null,
    kind: 'ScalarField',
    loc: moduleDirective.loc,
    metadata: {
      skipNormalizationNode: true
    },
    name: JS_FIELD_NAME,
    type: jsModuleType
  };
  return {
    kind: 'InlineFragment',
    directives: [],
    loc: moduleDirective.loc,
    metadata: null,
    selections: [{
      kind: 'ModuleImport',
      loc: moduleDirective.loc,
      documentName: documentName,
      id: moduleId,
      module: moduleName,
      name: spread.name,
      selections: [(0, _objectSpread2["default"])({}, spread, {
        directives: spread.directives.filter(function (directive) {
          return directive !== moduleDirective;
        })
      }), operationField, componentField]
    }],
    typeCondition: fragment.type
  };
}

module.exports = {
  SCHEMA_EXTENSION: SCHEMA_EXTENSION,
  transform: relayMatchTransform
};