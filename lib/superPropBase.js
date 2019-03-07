"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _superPropBase;

var _getPrototypeOf = _interopRequireDefault(require("./getPrototypeOf"));

function _superPropBase(object, property) {
  while (!Object.prototype.hasOwnProperty.call(object, property)) {
    object = (0, _getPrototypeOf["default"])(object);
    if (object === null) break;
  }

  return object;
}