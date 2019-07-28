/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 * @format
 * @emails oncall+relay
 */
'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var CompilerContext = require("./GraphQLCompilerContext");

var IRTransformer = require("./GraphQLIRTransformer");

var _require = require("graphql"),
    getNullableType = _require.getNullableType,
    isEnumType = _require.isEnumType,
    isNullableType = _require.isNullableType,
    isListType = _require.isListType;

// The purpose of this directive is to add GraphQL type inform for fields in
// the operation selection in order to use in in RelayMockPayloadGenerator
// to generate better mock values, and expand the API of MockResolvers
var SCHEMA_EXTENSION = 'directive @relay_test_operation on QUERY | MUTATION | SUBSCRIPTION';

function testOperationDirective(context) {
  return IRTransformer.transform(context, {
    Fragment: function Fragment(node) {
      return node;
    },
    Root: visitRoot,
    SplitOperation: function SplitOperation(node) {
      return node;
    }
  });
}

function getTypeDetails(fieldType) {
  var nullableType = getNullableType(fieldType);
  var isNullable = isNullableType(fieldType);
  var isPlural = isListType(nullableType);
  var type = isListType(nullableType) ? getNullableType(nullableType.ofType) : nullableType;
  return {
    type: isListType(type) ? String(type) : type != null ? type.name : 'String',
    enumValues: isEnumType(type) ? type.getValues().map(function (val) {
      return val.value;
    }) : null,
    plural: isPlural,
    nullable: isNullable
  };
}

function visitRoot(node) {
  var testDirective = node.directives.find(function (directive) {
    return directive.name === 'relay_test_operation';
  });

  if (testDirective == null) {
    return node;
  }

  var context = this.getContext();
  var queue = [{
    selections: node.selections,
    path: []
  }];
  var selectionsTypeInfo = {};

  var _loop = function _loop() {
    var _queue$pop = queue.pop(),
        currentSelections = _queue$pop.selections,
        path = _queue$pop.path;

    currentSelections.forEach(function (selection) {
      switch (selection.kind) {
        case 'FragmentSpread':
          var fragment = context.get(selection.name);

          if (fragment != null) {
            queue.unshift({
              selections: fragment.selections,
              path: path
            });
          }

          break;

        case 'ScalarField':
          {
            var nextPath = [].concat((0, _toConsumableArray2["default"])(path), [selection.alias]);
            selectionsTypeInfo[nextPath.join('.')] = getTypeDetails(selection.type);
            break;
          }

        case 'ConnectionField':
        case 'LinkedField':
          {
            var _nextPath = [].concat((0, _toConsumableArray2["default"])(path), [selection.alias]);

            selectionsTypeInfo[_nextPath.join('.')] = getTypeDetails(selection.type);
            queue.unshift({
              selections: selection.selections,
              path: _nextPath
            });
            break;
          }

        case 'Condition':
        case 'ClientExtension':
        case 'Defer':
        case 'InlineDataFragmentSpread':
        case 'InlineFragment':
        case 'ModuleImport':
        case 'Stream':
          queue.unshift({
            selections: selection.selections,
            path: path
          });
          break;

        default:
          selection;
          break;
      }
    });
  };

  while (queue.length > 0) {
    _loop();
  }

  return (0, _objectSpread2["default"])({}, node, {
    directives: node.directives.filter(function (directive) {
      return directive !== testDirective;
    }),
    metadata: (0, _objectSpread2["default"])({}, node.metadata || {}, {
      relayTestingSelectionTypeInfo: selectionsTypeInfo
    })
  });
}

module.exports = {
  SCHEMA_EXTENSION: SCHEMA_EXTENSION,
  transform: testOperationDirective
};