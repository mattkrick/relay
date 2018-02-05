/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule createModernNode
 * 
 * @format
 */

'use strict';

var _toConsumableArray3 = _interopRequireDefault(require('babel-runtime/helpers/toConsumableArray'));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _require = require('graphql'),
    print = _require.print;

var GENERATED = './__generated__/';

/**
 * Relay Modern creates separate generated files, so Babel transforms graphql
 * definitions to lazy require function calls.
 */
function createModernNode(t, graphqlDefinition, options) {
  var definitionName = graphqlDefinition.name && graphqlDefinition.name.value;
  if (!definitionName) {
    throw new Error('GraphQL operations and fragments must contain names');
  }
  var requiredFile = definitionName + '.graphql';
  var requiredPath = options.isHasteMode ? requiredFile : GENERATED + requiredFile;

  var hash = require('crypto').createHash('md5').update(print(graphqlDefinition), 'utf8').digest('hex');

  var requireGraphQLModule = t.callExpression(t.identifier('require'), [t.stringLiteral(requiredPath)]);

  var bodyStatements = [t.returnStatement(requireGraphQLModule)];
  if (options.isDevVariable != null || options.isDevelopment) {
    var nodeVariable = t.identifier('node');
    var nodeDotHash = t.memberExpression(nodeVariable, t.identifier('hash'));
    var checkStatements = [t.variableDeclaration('const', [t.variableDeclarator(nodeVariable, requireGraphQLModule)]), t.ifStatement(t.logicalExpression('&&', nodeDotHash, t.binaryExpression('!==', nodeDotHash, t.stringLiteral(hash))), t.blockStatement([t.expressionStatement(warnNeedsRebuild(t, definitionName, options.buildCommand))]))];
    if (options.isDevVariable != null) {
      checkStatements = [t.ifStatement(t.identifier(options.isDevVariable), t.blockStatement(checkStatements))];
    }
    bodyStatements.unshift.apply(bodyStatements, (0, _toConsumableArray3['default'])(checkStatements));
  }
  return t.functionExpression(null, [], t.blockStatement(bodyStatements));
}

function warnNeedsRebuild(t, definitionName, buildCommand) {
  return t.callExpression(t.memberExpression(t.identifier('console'), t.identifier('error')), [t.stringLiteral('The definition of \'' + definitionName + '\' appears to have changed. Run ' + '`' + buildCommand + '` to update the generated files to receive the expected data.')]);
}

module.exports = createModernNode;