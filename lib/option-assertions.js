"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.msg = msg;
exports.access = access;
exports.assertRootMode = assertRootMode;
exports.assertSourceMaps = assertSourceMaps;
exports.assertCompact = assertCompact;
exports.assertSourceType = assertSourceType;
exports.assertCallerMetadata = assertCallerMetadata;
exports.assertInputSourceMap = assertInputSourceMap;
exports.assertString = assertString;
exports.assertFunction = assertFunction;
exports.assertBoolean = assertBoolean;
exports.assertObject = assertObject;
exports.assertArray = assertArray;
exports.assertIgnoreList = assertIgnoreList;
exports.assertConfigApplicableTest = assertConfigApplicableTest;
exports.assertConfigFileSearch = assertConfigFileSearch;
exports.assertBabelrcSearch = assertBabelrcSearch;
exports.assertPluginList = assertPluginList;

function msg(loc) {
  switch (loc.type) {
    case "root":
      return "";

    case "env":
      return "".concat(msg(loc.parent), ".env[\"").concat(loc.name, "\"]");

    case "overrides":
      return "".concat(msg(loc.parent), ".overrides[").concat(loc.index, "]");

    case "option":
      return "".concat(msg(loc.parent), ".").concat(loc.name);

    case "access":
      return "".concat(msg(loc.parent), "[").concat(JSON.stringify(loc.name), "]");

    default:
      throw new Error("Assertion failure: Unknown type ".concat(loc.type));
  }
}

function access(loc, name) {
  return {
    type: "access",
    name: name,
    parent: loc
  };
}

function assertRootMode(loc, value) {
  if (value !== undefined && value !== "root" && value !== "upward" && value !== "upward-optional") {
    throw new Error("".concat(msg(loc), " must be a \"root\", \"upward\", \"upward-optional\" or undefined"));
  }

  return value;
}

function assertSourceMaps(loc, value) {
  if (value !== undefined && typeof value !== "boolean" && value !== "inline" && value !== "both") {
    throw new Error("".concat(msg(loc), " must be a boolean, \"inline\", \"both\", or undefined"));
  }

  return value;
}

function assertCompact(loc, value) {
  if (value !== undefined && typeof value !== "boolean" && value !== "auto") {
    throw new Error("".concat(msg(loc), " must be a boolean, \"auto\", or undefined"));
  }

  return value;
}

function assertSourceType(loc, value) {
  if (value !== undefined && value !== "module" && value !== "script" && value !== "unambiguous") {
    throw new Error("".concat(msg(loc), " must be \"module\", \"script\", \"unambiguous\", or undefined"));
  }

  return value;
}

function assertCallerMetadata(loc, value) {
  var obj = assertObject(loc, value);

  if (obj) {
    if (typeof obj["name"] !== "string") {
      throw new Error("".concat(msg(loc), " set but does not contain \"name\" property string"));
    }

    var _arr = Object.keys(obj);

    for (var _i = 0; _i < _arr.length; _i++) {
      var prop = _arr[_i];
      var propLoc = access(loc, prop);
      var _value = obj[prop];

      if (_value != null && typeof _value !== "boolean" && typeof _value !== "string" && typeof _value !== "number") {
        throw new Error("".concat(msg(propLoc), " must be null, undefined, a boolean, a string, or a number."));
      }
    }
  }

  return value;
}

function assertInputSourceMap(loc, value) {
  if (value !== undefined && typeof value !== "boolean" && (typeof value !== "object" || !value)) {
    throw new Error("".concat(msg(loc), " must be a boolean, object, or undefined"));
  }

  return value;
}

function assertString(loc, value) {
  if (value !== undefined && typeof value !== "string") {
    throw new Error("".concat(msg(loc), " must be a string, or undefined"));
  }

  return value;
}

function assertFunction(loc, value) {
  if (value !== undefined && typeof value !== "function") {
    throw new Error("".concat(msg(loc), " must be a function, or undefined"));
  }

  return value;
}

function assertBoolean(loc, value) {
  if (value !== undefined && typeof value !== "boolean") {
    throw new Error("".concat(msg(loc), " must be a boolean, or undefined"));
  }

  return value;
}

function assertObject(loc, value) {
  if (value !== undefined && (typeof value !== "object" || Array.isArray(value) || !value)) {
    throw new Error("".concat(msg(loc), " must be an object, or undefined"));
  }

  return value;
}

function assertArray(loc, value) {
  if (value != null && !Array.isArray(value)) {
    throw new Error("".concat(msg(loc), " must be an array, or undefined"));
  }

  return value;
}

function assertIgnoreList(loc, value) {
  var arr = assertArray(loc, value);

  if (arr) {
    arr.forEach(function (item, i) {
      return assertIgnoreItem(access(loc, i), item);
    });
  }

  return arr;
}

function assertIgnoreItem(loc, value) {
  if (typeof value !== "string" && typeof value !== "function" && !(value instanceof RegExp)) {
    throw new Error("".concat(msg(loc), " must be an array of string/Funtion/RegExp values, or undefined"));
  }

  return value;
}

function assertConfigApplicableTest(loc, value) {
  if (value === undefined) return value;

  if (Array.isArray(value)) {
    value.forEach(function (item, i) {
      if (!checkValidTest(item)) {
        throw new Error("".concat(msg(access(loc, i)), " must be a string/Function/RegExp."));
      }
    });
  } else if (!checkValidTest(value)) {
    throw new Error("".concat(msg(loc), " must be a string/Function/RegExp, or an array of those"));
  }

  return value;
}

function checkValidTest(value) {
  return typeof value === "string" || typeof value === "function" || value instanceof RegExp;
}

function assertConfigFileSearch(loc, value) {
  if (value !== undefined && typeof value !== "boolean" && typeof value !== "string") {
    throw new Error("".concat(msg(loc), " must be a undefined, a boolean, a string, ") + "got ".concat(JSON.stringify(value)));
  }

  return value;
}

function assertBabelrcSearch(loc, value) {
  if (value === undefined || typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    value.forEach(function (item, i) {
      if (!checkValidTest(item)) {
        throw new Error("".concat(msg(access(loc, i)), " must be a string/Function/RegExp."));
      }
    });
  } else if (!checkValidTest(value)) {
    throw new Error("".concat(msg(loc), " must be a undefined, a boolean, a string/Function/RegExp ") + "or an array of those, got ".concat(JSON.stringify(value)));
  }

  return value;
}

function assertPluginList(loc, value) {
  var arr = assertArray(loc, value);

  if (arr) {
    arr.forEach(function (item, i) {
      return assertPluginItem(access(loc, i), item);
    });
  }

  return arr;
}

function assertPluginItem(loc, value) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new Error("".concat(msg(loc), " must include an object"));
    }

    if (value.length > 3) {
      throw new Error("".concat(msg(loc), " may only be a two-tuple or three-tuple"));
    }

    assertPluginTarget(access(loc, 0), value[0]);

    if (value.length > 1) {
      var opts = value[1];

      if (opts !== undefined && opts !== false && (typeof opts !== "object" || Array.isArray(opts))) {
        throw new Error("".concat(msg(access(loc, 1)), " must be an object, false, or undefined"));
      }
    }

    if (value.length === 3) {
      var name = value[2];

      if (name !== undefined && typeof name !== "string") {
        throw new Error("".concat(msg(access(loc, 2)), " must be a string, or undefined"));
      }
    }
  } else {
    assertPluginTarget(loc, value);
  }

  return value;
}

function assertPluginTarget(loc, value) {
  if ((typeof value !== "object" || !value) && typeof value !== "string" && typeof value !== "function") {
    throw new Error("".concat(msg(loc), " must be a string, object, function"));
  }

  return value;
}