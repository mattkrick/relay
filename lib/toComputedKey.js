"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = toComputedKey;

var _generated = require("./generated");

var _generated2 = require("./generated");

function toComputedKey(node) {
  var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : node.key || node.property;
  if (!node.computed && (0, _generated.isIdentifier)(key)) key = (0, _generated2.stringLiteral)(key.name);
  return key;
}