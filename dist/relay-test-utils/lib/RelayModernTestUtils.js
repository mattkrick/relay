/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule RelayModernTestUtils
 * @format
 */

'use strict';

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _defineProperty3 = _interopRequireDefault(require('babel-runtime/helpers/defineProperty'));

let getOutputForFixture = (() => {
  var _ref3 = (0, _asyncToGenerator3.default)(function* (input, operation) {
    try {
      var output = operation(input);
      return output instanceof Promise ? yield output : output;
    } catch (e) {
      return 'THROWN EXCEPTION:\n\n' + e.toString();
    }
  });

  return function getOutputForFixture(_x2, _x3) {
    return _ref3.apply(this, arguments);
  };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var FIXTURE_TAG = Symbol['for']('FIXTURE_TAG');

/**
 * Extend Jest with a custom snapshot serializer to provide additional context
 * and reduce the amount of escaping that occurs.
 */
expect.addSnapshotSerializer({
  print: function print(value) {
    return Object.keys(value).map(function (key) {
      return '~~~~~~~~~~ ' + key.toUpperCase() + ' ~~~~~~~~~~\n' + value[key];
    }).join('\n');
  },
  test: function test(value) {
    return value && value[FIXTURE_TAG] === true;
  }
});

/**
 * Utilities (custom matchers etc) for Relay "static" tests.
 */
var RelayModernTestUtils = {
  matchers: {
    toBeDeeplyFrozen: function toBeDeeplyFrozen(actual) {
      var _require = require('iterall'),
          isCollection = _require.isCollection,
          forEach = _require.forEach;

      function check(value) {
        expect(Object.isFrozen(value)).toBe(true);
        if (isCollection(value)) {
          forEach(value, check);
        } else if (typeof value === 'object' && value !== null) {
          for (var _key in value) {
            check(value[_key]);
          }
        }
      }
      check(actual);
      return {
        pass: true
      };
    },
    toFailInvariant: function toFailInvariant(actual, expected) {
      expect(actual).toThrowError(expected);
      return {
        pass: true
      };
    },
    toWarn: function toWarn(actual, expected) {
      var negative = this.isNot;

      function formatItem(item) {
        return item instanceof RegExp ? item.toString() : JSON.stringify(item);
      }

      function formatArray(array) {
        return '[' + array.map(formatItem).join(', ') + ']';
      }

      function formatExpected(args) {
        return formatArray([false].concat(args));
      }

      function formatActual(calls) {
        if (calls.length) {
          return calls.map(function (args) {
            return formatArray([!!args[0]].concat(args.slice(1)));
          }).join(', ');
        } else {
          return '[]';
        }
      }

      var warning = require('fbjs/lib/warning');
      if (!warning.mock) {
        throw new Error("toWarn(): Requires `jest.mock('warning')`.");
      }

      var callsCount = warning.mock.calls.length;
      actual();
      var calls = warning.mock.calls.slice(callsCount);

      // Simple case: no explicit expectation.
      if (!expected) {
        var warned = calls.filter(function (args) {
          return !args[0];
        }).length;
        return {
          pass: !!warned,
          message: function message() {
            return 'Expected ' + (negative ? 'not ' : '') + 'to warn but ' + '`warning` received the following calls: ' + (formatActual(calls) + '.');
          }
        };
      }

      // Custom case: explicit expectation.
      if (!Array.isArray(expected)) {
        expected = [expected];
      }
      var call = calls.find(function (args) {
        return args.length === expected.length + 1 && args.every(function (arg, index) {
          if (!index) {
            return !arg;
          }
          var other = expected[index - 1];
          return other instanceof RegExp ? other.test(arg) : arg === other;
        });
      });

      return {
        pass: !!call,
        message: function message() {
          return 'Expected ' + (negative ? 'not ' : '') + 'to warn: ' + (formatExpected(expected) + ' but ') + '`warning` received the following calls: ' + (formatActual(calls) + '.');
        }
      };
    },
    toThrowTypeError: function toThrowTypeError(fn) {
      var pass = false;
      try {
        fn();
      } catch (e) {
        pass = e instanceof TypeError;
      }
      return {
        pass: pass,
        message: function message() {
          return 'Expected function to throw a TypeError.';
        }
      };
    }
  },

  /**
   * Parses GraphQL text, applies the selected transforms only (or none if
   * transforms is not specified), and returns a mapping of definition name to
   * its basic generated representation.
   */
  generateWithTransforms: function generateWithTransforms(text, transforms) {
    var RelayTestSchema = require('./RelayTestSchema');
    return generate(text, RelayTestSchema, {
      commonTransforms: transforms || [],
      fragmentTransforms: [],
      queryTransforms: [],
      codegenTransforms: [],
      printTransforms: []
    });
  },


  /**
   * Compiles the given GraphQL text using the standard set of transforms (as
   * defined in RelayCompiler) and returns a mapping of definition name to
   * its full runtime representation.
   */
  generateAndCompile: function generateAndCompile(text, schema) {
    var RelayCompilerPublic = require('relay-compiler');
    var IRTransforms = RelayCompilerPublic.IRTransforms;

    var RelayTestSchema = require('./RelayTestSchema');
    return generate(text, schema || RelayTestSchema, IRTransforms);
  },


  /**
   * Generates a set of jest snapshot tests that compare the output of the
   * provided `operation` to each of the matching files in the `fixturesPath`.
   */
  generateTestsFromFixtures: function generateTestsFromFixtures(fixturesPath, operation) {
    var fs = require('fs');
    var path = require('path');
    var tests = fs.readdirSync(fixturesPath).map((() => {
      var _ref = (0, _asyncToGenerator3.default)(function* (file) {
        var input = fs.readFileSync(path.join(fixturesPath, file), 'utf8');
        var output = yield getOutputForFixture(input, operation);
        return {
          file: file,
          input: input,
          output: output
        };
      });

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    })());
    require('fbjs/lib/invariant')(tests.length > 0, 'generateTestsFromFixtures: No fixtures found at %s', fixturesPath);
    it('matches expected output', (0, _asyncToGenerator3.default)(function* () {
      var results = yield Promise.all(tests);
      results.forEach(function (test) {
        var _expect;

        expect((_expect = {}, (0, _defineProperty3['default'])(_expect, FIXTURE_TAG, true), (0, _defineProperty3['default'])(_expect, 'input', test.input), (0, _defineProperty3['default'])(_expect, 'output', test.output), _expect)).toMatchSnapshot(test.file);
      });
    }));
  },


  /**
   * Returns original component class wrapped by e.g. createFragmentContainer
   */
  unwrapContainer: function unwrapContainer(ComponentClass) {
    // $FlowExpectedError
    var unwrapped = ComponentClass.__ComponentClass;
    require('fbjs/lib/invariant')(unwrapped != null, 'Could not find component for %s, is it a Relay container?', ComponentClass.displayName || ComponentClass.name);
    return unwrapped;
  }
};

function generate(text, schema, transforms) {
  var RelayCompilerPublic = require('relay-compiler');
  var compileRelayArtifacts = RelayCompilerPublic.compileRelayArtifacts,
      GraphQLCompilerContext = RelayCompilerPublic.GraphQLCompilerContext,
      IRTransforms = RelayCompilerPublic.IRTransforms,
      transformASTSchema = RelayCompilerPublic.transformASTSchema;


  var relaySchema = transformASTSchema(schema, IRTransforms.schemaExtensions);
  var compilerContext = new GraphQLCompilerContext(schema, relaySchema).addAll(require('./parseGraphQLText')(relaySchema, text).definitions);
  var documentMap = {};
  compileRelayArtifacts(compilerContext, transforms).forEach(function (node) {
    documentMap[node.name] = node;
  });
  return documentMap;
}

module.exports = RelayModernTestUtils;