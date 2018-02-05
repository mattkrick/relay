/**
 * Relay v1.5.0-rc.1
 */
var RelayTestUtils =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * Copyright (c) 2013-present, Facebook, Inc.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 * 
	 * @format
	 * @providesModule RelayTestUtilsPublic
	 */

	'use strict';

	/**
	 * The public interface to Relay Test Utils.
	 */
	module.exports = {
	  MockEnvironment: __webpack_require__(10),
	  testSchemaPath: __webpack_require__(5)
	};

/***/ }),
/* 1 */
/***/ (function(module, exports) {

	module.exports = relay-runtime;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

	module.exports = fbjs/lib/invariant;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * Copyright (c) 2013-present, Facebook, Inc.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 * @providesModule RelayTestSchema
	 * 
	 * @format
	 */

	'use strict';

	var _require = __webpack_require__(8),
	    buildASTSchema = _require.buildASTSchema,
	    parse = _require.parse;

	module.exports = buildASTSchema(parse(__webpack_require__(7).readFileSync(__webpack_require__(5), 'utf8'), { assumeValid: true }));

/***/ }),
/* 4 */
/***/ (function(module, exports) {

	module.exports = relay-compiler;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(__dirname) {/**
	 * Copyright (c) 2013-present, Facebook, Inc.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 * @providesModule RelayTestSchemaPath
	 * 
	 * @format
	 */

	'use strict';

	module.exports = __webpack_require__(9).join(__dirname, 'testschema.graphql');
	/* WEBPACK VAR INJECTION */}.call(exports, "/"))

/***/ }),
/* 6 */
/***/ (function(module, exports) {

	module.exports = fbjs/lib/areEqual;

/***/ }),
/* 7 */
/***/ (function(module, exports) {

	module.exports = fs;

/***/ }),
/* 8 */
/***/ (function(module, exports) {

	module.exports = graphql;

/***/ }),
/* 9 */
/***/ (function(module, exports) {

	module.exports = path;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * Copyright (c) 2013-present, Facebook, Inc.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 * @providesModule RelayModernMockEnvironment
	 * @format
	 */

	'use strict';

	var MAX_SIZE = 10;
	var MAX_TTL = 5 * 60 * 1000; // 5 min

	function mockInstanceMethod(object, key) {
	  object[key] = jest.fn(object[key].bind(object));
	}

	function mockDisposableMethod(object, key) {
	  var fn = object[key].bind(object);
	  object[key] = jest.fn(function () {
	    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }

	    var disposable = fn.apply(undefined, args);
	    var dispose = jest.fn(function () {
	      return disposable.dispose();
	    });
	    object[key].mock.dispose = dispose;
	    return { dispose: dispose };
	  });
	  var mockClear = object[key].mockClear.bind(object[key]);
	  object[key].mockClear = function () {
	    mockClear();
	    object[key].mock.dispose = null;
	  };
	}

	function mockObservableMethod(object, key) {
	  var fn = object[key].bind(object);
	  object[key] = jest.fn(function () {
	    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	      args[_key2] = arguments[_key2];
	    }

	    return fn.apply(undefined, args)['do']({
	      start: function start(subscription) {
	        object[key].mock.subscriptions.push(subscription);
	      }
	    });
	  });
	  object[key].mock.subscriptions = [];
	  var mockClear = object[key].mockClear.bind(object[key]);
	  object[key].mockClear = function () {
	    mockClear();
	    object[key].mock.subscriptions = [];
	  };
	}

	/**
	 * Creates an instance of the `Environment` interface defined in
	 * RelayStoreTypes with a mocked network layer.
	 *
	 * Usage:
	 *
	 * ```
	 * const environment = RelayModernMockEnvironment.createMockEnvironment();
	 * ```
	 *
	 * Mock API:
	 *
	 * Helpers are available as `environment.mock.<helper>`:
	 *
	 * - `compile(text: string): {[queryName]: Query}`: Create a query.
	 * - `isLoading(query, variables): boolean`: Determine whether the given query
	 *   is currently being loaded (not yet rejected/resolved).
	 * - `reject(query, error: Error): void`: Reject a query that has been fetched
	 *   by the environment.
	 * - `resolve(query, payload: PayloadData): void`: Resolve a query that has been
	 *   fetched by the environment.
	 */
	function createMockEnvironment(options) {
	  var RecordSource = __webpack_require__(1).RecordSource,
	      Store = __webpack_require__(1).Store,
	      QueryResponseCache = __webpack_require__(1).QueryResponseCache,
	      Observable = __webpack_require__(1).Observable,
	      Environment = __webpack_require__(1).Environment,
	      Network = __webpack_require__(1).Network; // destructure here to make jest and inline-requires work


	  var schema = options && options.schema;
	  var handlerProvider = options && options.handlerProvider;
	  var source = new RecordSource();
	  var store = new Store(source);
	  var cache = new QueryResponseCache({
	    size: MAX_SIZE,
	    ttl: MAX_TTL
	  });

	  // Mock the network layer
	  var pendingRequests = [];
	  var execute = function execute(request, variables, cacheConfig) {
	    var id = request.id,
	        text = request.text;

	    var cacheID = id || text;

	    var cachedPayload = null;
	    if (!cacheConfig || !cacheConfig.force) {
	      cachedPayload = cache.get(cacheID, variables);
	    }
	    if (cachedPayload !== null) {
	      return Observable.from(cachedPayload);
	    }

	    var nextRequest = { request: request, variables: variables, cacheConfig: cacheConfig };
	    pendingRequests = pendingRequests.concat([nextRequest]);

	    return Observable.create(function (sink) {
	      nextRequest.sink = sink;
	      return function () {
	        pendingRequests = pendingRequests.filter(function (pending) {
	          return pending !== nextRequest;
	        });
	      };
	    });
	  };

	  function getRequest(request) {
	    var foundRequest = pendingRequests.find(function (pending) {
	      return pending.request === request;
	    });
	    __webpack_require__(2)(foundRequest && foundRequest.sink, 'MockEnvironment: Cannot respond to `%s`, it has not been requested yet.', request.name);
	    return foundRequest;
	  }

	  function ensureValidPayload(payload) {
	    __webpack_require__(2)(typeof payload === 'object' && payload !== null && payload.hasOwnProperty('data'), 'MockEnvironment(): Expected payload to be an object with a `data` key.');
	    return payload;
	  }

	  var cachePayload = function cachePayload(request, variables, payload) {
	    var id = request.id,
	        text = request.text;

	    var cacheID = id || text;
	    cache.set(cacheID, variables, payload);
	  };

	  var clearCache = function clearCache() {
	    cache.clear();
	  };

	  if (!schema) {
	    global.__RELAYOSS__ = true;
	  }

	  // Helper to compile a query with the given schema (or the test schema by
	  // default).
	  var compile = function compile(text) {
	    return __webpack_require__(11).generateAndCompile(text, schema || __webpack_require__(3));
	  };

	  // Helper to determine if a given query/variables pair is pending
	  var isLoading = function isLoading(request, variables, cacheConfig) {
	    return pendingRequests.some(function (pending) {
	      return pending.request === request && __webpack_require__(6)(pending.variables, variables) && __webpack_require__(6)(pending.cacheConfig, cacheConfig || {});
	    });
	  };

	  // Helpers to reject or resolve the payload for an individual request.
	  var reject = function reject(request, error) {
	    if (typeof error === 'string') {
	      error = new Error(error);
	    }
	    getRequest(request).sink.error(error);
	  };

	  var nextValue = function nextValue(request, payload) {
	    var _getRequest = getRequest(request),
	        sink = _getRequest.sink,
	        variables = _getRequest.variables;

	    sink.next({
	      operation: request.operation,
	      variables: variables,
	      response: ensureValidPayload(payload)
	    });
	  };

	  var complete = function complete(request) {
	    getRequest(request).sink.complete();
	  };

	  var resolve = function resolve(request, payload) {
	    var _getRequest2 = getRequest(request),
	        sink = _getRequest2.sink,
	        variables = _getRequest2.variables;

	    sink.next({
	      operation: request.operation,
	      variables: variables,
	      response: ensureValidPayload(payload)
	    });
	    sink.complete();
	  };

	  // Mock instance
	  var environment = new Environment({
	    configName: 'RelayModernMockEnvironment',
	    handlerProvider: handlerProvider,
	    network: Network.create(execute, execute),
	    store: store
	  });
	  // Mock all the functions with their original behavior
	  mockDisposableMethod(environment, 'applyUpdate');
	  mockInstanceMethod(environment, 'commitPayload');
	  mockInstanceMethod(environment, 'getStore');
	  mockInstanceMethod(environment, 'lookup');
	  mockInstanceMethod(environment, 'check');
	  mockDisposableMethod(environment, 'subscribe');
	  mockDisposableMethod(environment, 'retain');
	  mockObservableMethod(environment, 'execute');
	  mockObservableMethod(environment, 'executeMutation');

	  mockInstanceMethod(store, 'getSource');
	  mockInstanceMethod(store, 'lookup');
	  mockInstanceMethod(store, 'notify');
	  mockInstanceMethod(store, 'publish');
	  mockDisposableMethod(store, 'retain');
	  mockDisposableMethod(store, 'subscribe');

	  environment.mock = {
	    cachePayload: cachePayload,
	    clearCache: clearCache,
	    compile: compile,
	    isLoading: isLoading,
	    reject: reject,
	    resolve: resolve,
	    nextValue: nextValue,
	    complete: complete
	  };

	  environment.mockClear = function () {
	    environment.applyUpdate.mockClear();
	    environment.commitPayload.mockClear();
	    environment.getStore.mockClear();
	    environment.lookup.mockClear();
	    environment.check.mockClear();
	    environment.subscribe.mockClear();
	    environment.retain.mockClear();
	    environment.execute.mockClear();
	    environment.executeMutation.mockClear();

	    store.getSource.mockClear();
	    store.lookup.mockClear();
	    store.notify.mockClear();
	    store.publish.mockClear();
	    store.retain.mockClear();
	    store.subscribe.mockClear();

	    cache.clear();

	    pendingRequests = [];
	  };

	  return environment;
	}

	module.exports = { createMockEnvironment: createMockEnvironment };

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

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

	var _asyncToGenerator2 = __webpack_require__(13);

	var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

	var _defineProperty3 = _interopRequireDefault(__webpack_require__(14));

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
	      var _require = __webpack_require__(16),
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

	      var warning = __webpack_require__(15);
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
	    var RelayTestSchema = __webpack_require__(3);
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
	    var RelayCompilerPublic = __webpack_require__(4);
	    var IRTransforms = RelayCompilerPublic.IRTransforms;

	    var RelayTestSchema = __webpack_require__(3);
	    return generate(text, schema || RelayTestSchema, IRTransforms);
	  },


	  /**
	   * Generates a set of jest snapshot tests that compare the output of the
	   * provided `operation` to each of the matching files in the `fixturesPath`.
	   */
	  generateTestsFromFixtures: function generateTestsFromFixtures(fixturesPath, operation) {
	    var fs = __webpack_require__(7);
	    var path = __webpack_require__(9);
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
	    __webpack_require__(2)(tests.length > 0, 'generateTestsFromFixtures: No fixtures found at %s', fixturesPath);
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
	    __webpack_require__(2)(unwrapped != null, 'Could not find component for %s, is it a Relay container?', ComponentClass.displayName || ComponentClass.name);
	    return unwrapped;
	  }
	};

	function generate(text, schema, transforms) {
	  var RelayCompilerPublic = __webpack_require__(4);
	  var compileRelayArtifacts = RelayCompilerPublic.compileRelayArtifacts,
	      GraphQLCompilerContext = RelayCompilerPublic.GraphQLCompilerContext,
	      IRTransforms = RelayCompilerPublic.IRTransforms,
	      transformASTSchema = RelayCompilerPublic.transformASTSchema;


	  var relaySchema = transformASTSchema(schema, IRTransforms.schemaExtensions);
	  var compilerContext = new GraphQLCompilerContext(schema, relaySchema).addAll(__webpack_require__(12)(relaySchema, text).definitions);
	  var documentMap = {};
	  compileRelayArtifacts(compilerContext, transforms).forEach(function (node) {
	    documentMap[node.name] = node;
	  });
	  return documentMap;
	}

	module.exports = RelayModernTestUtils;

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

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

	var _require = __webpack_require__(8),
	    extendSchema = _require.extendSchema,
	    parse = _require.parse;

	var _require2 = __webpack_require__(4),
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

/***/ }),
/* 13 */
/***/ (function(module, exports) {

	module.exports = babel-runtime/helpers/asyncToGenerator;

/***/ }),
/* 14 */
/***/ (function(module, exports) {

	module.exports = babel-runtime/helpers/defineProperty;

/***/ }),
/* 15 */
/***/ (function(module, exports) {

	module.exports = fbjs/lib/warning;

/***/ }),
/* 16 */
/***/ (function(module, exports) {

	module.exports = iterall;

/***/ })
/******/ ]);