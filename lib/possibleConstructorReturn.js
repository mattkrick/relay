"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _possibleConstructorReturn;

var _typeof2 = _interopRequireDefault(require("./typeof"));

var _assertThisInitialized = _interopRequireDefault(require("./assertThisInitialized"));

function _possibleConstructorReturn(self, call) {
  if (call && ((0, _typeof2["default"])(call) === "object" || typeof call === "function")) {
    return call;
  }

  return (0, _assertThisInitialized["default"])(self);
}