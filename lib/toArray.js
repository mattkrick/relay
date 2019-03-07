"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _toArray;

var _arrayWithHoles = _interopRequireDefault(require("./arrayWithHoles"));

var _iterableToArray = _interopRequireDefault(require("./iterableToArray"));

var _nonIterableRest = _interopRequireDefault(require("./nonIterableRest"));

function _toArray(arr) {
  return (0, _arrayWithHoles["default"])(arr) || (0, _iterableToArray["default"])(arr) || (0, _nonIterableRest["default"])();
}