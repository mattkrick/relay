"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _slicedToArray;

var _arrayWithHoles = _interopRequireDefault(require("./arrayWithHoles"));

var _iterableToArrayLimit = _interopRequireDefault(require("./iterableToArrayLimit"));

var _nonIterableRest = _interopRequireDefault(require("./nonIterableRest"));

function _slicedToArray(arr, i) {
  return (0, _arrayWithHoles["default"])(arr) || (0, _iterableToArrayLimit["default"])(arr, i) || (0, _nonIterableRest["default"])();
}