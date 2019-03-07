"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = toKeyAlias;

var _generated = require("./generated");

var _cloneNode = _interopRequireDefault(require("./cloneNode"));

var _removePropertiesDeep = _interopRequireDefault(require("./removePropertiesDeep"));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

function toKeyAlias(node) {
  var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : node.key;
  var alias;

  if (node.kind === "method") {
    return toKeyAlias.increment() + "";
  } else if ((0, _generated.isIdentifier)(key)) {
    alias = key.name;
  } else if ((0, _generated.isStringLiteral)(key)) {
    alias = JSON.stringify(key.value);
  } else {
    alias = JSON.stringify((0, _removePropertiesDeep["default"])((0, _cloneNode["default"])(key)));
  }

  if (node.computed) {
    alias = "[".concat(alias, "]");
  }

  if (node["static"]) {
    alias = "static:".concat(alias);
  }

  return alias;
}

toKeyAlias.uid = 0;

toKeyAlias.increment = function () {
  if (toKeyAlias.uid >= Number.MAX_SAFE_INTEGER) {
    return toKeyAlias.uid = 0;
  } else {
    return toKeyAlias.uid++;
  }
};