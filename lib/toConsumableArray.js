"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _toConsumableArray;

var _arrayWithoutHoles = _interopRequireDefault(require("./arrayWithoutHoles"));

var _iterableToArray = _interopRequireDefault(require("./iterableToArray"));

var _nonIterableSpread = _interopRequireDefault(require("./nonIterableSpread"));

function _toConsumableArray(arr) {
  return (0, _arrayWithoutHoles["default"])(arr) || (0, _iterableToArray["default"])(arr) || (0, _nonIterableSpread["default"])();
}