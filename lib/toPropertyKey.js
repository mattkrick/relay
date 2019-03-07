"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _toPropertyKey;

var _typeof2 = _interopRequireDefault(require("./typeof"));

var _toPrimitive = _interopRequireDefault(require("./toPrimitive"));

function _toPropertyKey(arg) {
  var key = (0, _toPrimitive["default"])(arg, "string");
  return (0, _typeof2["default"])(key) === "symbol" ? key : String(key);
}