"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validate = validate;

var _plugin = _interopRequireDefault(require("./plugin"));

var _removed = _interopRequireDefault(require("./removed"));

var _optionAssertions = require("./option-assertions");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

var ROOT_VALIDATORS = {
  cwd: _optionAssertions.assertString,
  root: _optionAssertions.assertString,
  rootMode: _optionAssertions.assertRootMode,
  configFile: _optionAssertions.assertConfigFileSearch,
  caller: _optionAssertions.assertCallerMetadata,
  filename: _optionAssertions.assertString,
  filenameRelative: _optionAssertions.assertString,
  code: _optionAssertions.assertBoolean,
  ast: _optionAssertions.assertBoolean,
  envName: _optionAssertions.assertString
};
var BABELRC_VALIDATORS = {
  babelrc: _optionAssertions.assertBoolean,
  babelrcRoots: _optionAssertions.assertBabelrcSearch
};
var NONPRESET_VALIDATORS = {
  "extends": _optionAssertions.assertString,
  ignore: _optionAssertions.assertIgnoreList,
  only: _optionAssertions.assertIgnoreList
};
var COMMON_VALIDATORS = {
  inputSourceMap: _optionAssertions.assertInputSourceMap,
  presets: _optionAssertions.assertPluginList,
  plugins: _optionAssertions.assertPluginList,
  passPerPreset: _optionAssertions.assertBoolean,
  env: assertEnvSet,
  overrides: assertOverridesList,
  test: _optionAssertions.assertConfigApplicableTest,
  include: _optionAssertions.assertConfigApplicableTest,
  exclude: _optionAssertions.assertConfigApplicableTest,
  retainLines: _optionAssertions.assertBoolean,
  comments: _optionAssertions.assertBoolean,
  shouldPrintComment: _optionAssertions.assertFunction,
  compact: _optionAssertions.assertCompact,
  minified: _optionAssertions.assertBoolean,
  auxiliaryCommentBefore: _optionAssertions.assertString,
  auxiliaryCommentAfter: _optionAssertions.assertString,
  sourceType: _optionAssertions.assertSourceType,
  wrapPluginVisitorMethod: _optionAssertions.assertFunction,
  highlightCode: _optionAssertions.assertBoolean,
  sourceMaps: _optionAssertions.assertSourceMaps,
  sourceMap: _optionAssertions.assertSourceMaps,
  sourceFileName: _optionAssertions.assertString,
  sourceRoot: _optionAssertions.assertString,
  getModuleId: _optionAssertions.assertFunction,
  moduleRoot: _optionAssertions.assertString,
  moduleIds: _optionAssertions.assertBoolean,
  moduleId: _optionAssertions.assertString,
  parserOpts: _optionAssertions.assertObject,
  generatorOpts: _optionAssertions.assertObject
};

function getSource(loc) {
  return loc.type === "root" ? loc.source : getSource(loc.parent);
}

function validate(type, opts) {
  return validateNested({
    type: "root",
    source: type
  }, opts);
}

function validateNested(loc, opts) {
  var type = getSource(loc);
  assertNoDuplicateSourcemap(opts);
  Object.keys(opts).forEach(function (key) {
    var optLoc = {
      type: "option",
      name: key,
      parent: loc
    };

    if (type === "preset" && NONPRESET_VALIDATORS[key]) {
      throw new Error("".concat((0, _optionAssertions.msg)(optLoc), " is not allowed in preset options"));
    }

    if (type !== "arguments" && ROOT_VALIDATORS[key]) {
      throw new Error("".concat((0, _optionAssertions.msg)(optLoc), " is only allowed in root programmatic options"));
    }

    if (type !== "arguments" && type !== "configfile" && BABELRC_VALIDATORS[key]) {
      if (type === "babelrcfile" || type === "extendsfile") {
        throw new Error("".concat((0, _optionAssertions.msg)(optLoc), " is not allowed in .babelrc or \"extends\"ed files, only in root programmatic options, ") + "or babel.config.js/config file options");
      }

      throw new Error("".concat((0, _optionAssertions.msg)(optLoc), " is only allowed in root programmatic options, or babel.config.js/config file options"));
    }

    var validator = COMMON_VALIDATORS[key] || NONPRESET_VALIDATORS[key] || BABELRC_VALIDATORS[key] || ROOT_VALIDATORS[key] || throwUnknownError;
    validator(optLoc, opts[key]);
  });
  return opts;
}

function throwUnknownError(loc) {
  var key = loc.name;

  if (_removed["default"][key]) {
    var _removed$default$key = _removed["default"][key],
        message = _removed$default$key.message,
        _removed$default$key$ = _removed$default$key.version,
        version = _removed$default$key$ === void 0 ? 5 : _removed$default$key$;
    throw new ReferenceError("Using removed Babel ".concat(version, " option: ").concat((0, _optionAssertions.msg)(loc), " - ").concat(message));
  } else {
    var unknownOptErr = "Unknown option: ".concat((0, _optionAssertions.msg)(loc), ". Check out https://babeljs.io/docs/en/babel-core/#options for more information about options.");
    throw new ReferenceError(unknownOptErr);
  }
}

function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function assertNoDuplicateSourcemap(opts) {
  if (has(opts, "sourceMap") && has(opts, "sourceMaps")) {
    throw new Error(".sourceMap is an alias for .sourceMaps, cannot use both");
  }
}

function assertEnvSet(loc, value) {
  if (loc.parent.type === "env") {
    throw new Error("".concat((0, _optionAssertions.msg)(loc), " is not allowed inside of another .env block"));
  }

  var parent = loc.parent;
  var obj = (0, _optionAssertions.assertObject)(loc, value);

  if (obj) {
    var _arr = Object.keys(obj);

    for (var _i = 0; _i < _arr.length; _i++) {
      var envName = _arr[_i];
      var env = (0, _optionAssertions.assertObject)((0, _optionAssertions.access)(loc, envName), obj[envName]);
      if (!env) continue;
      var envLoc = {
        type: "env",
        name: envName,
        parent: parent
      };
      validateNested(envLoc, env);
    }
  }

  return obj;
}

function assertOverridesList(loc, value) {
  if (loc.parent.type === "env") {
    throw new Error("".concat((0, _optionAssertions.msg)(loc), " is not allowed inside an .env block"));
  }

  if (loc.parent.type === "overrides") {
    throw new Error("".concat((0, _optionAssertions.msg)(loc), " is not allowed inside an .overrides block"));
  }

  var parent = loc.parent;
  var arr = (0, _optionAssertions.assertArray)(loc, value);

  if (arr) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = arr.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _step$value = _step.value,
            index = _step$value[0],
            item = _step$value[1];
        var objLoc = (0, _optionAssertions.access)(loc, index);
        var env = (0, _optionAssertions.assertObject)(objLoc, item);
        if (!env) throw new Error("".concat((0, _optionAssertions.msg)(objLoc), " must be an object"));
        var overridesLoc = {
          type: "overrides",
          index: index,
          parent: parent
        };
        validateNested(overridesLoc, env);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  return arr;
}