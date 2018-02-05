/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule parseGraphQLText
 * 
 * @format
 */

'use strict';

var _require = require('graphql'),
    extendSchema = _require.extendSchema,
    parse = _require.parse;

var _require2 = require('relay-compiler'),
    Parser = _require2.Parser,
    convertASTDocuments = _require2.convertASTDocuments;

function parseGraphQLText(schema, text) {
  var ast = parse(text);
  // TODO T24511737 figure out if this is dangerous
  var extendedSchema = extendSchema(schema, ast, { assumeValid: true });
  var definitions = convertASTDocuments(extendedSchema, [ast], [], Parser.transform.bind(Parser));
  return {
    definitions: definitions,
    schema: extendedSchema !== schema ? extendedSchema : null
  };
}

module.exports = parseGraphQLText;