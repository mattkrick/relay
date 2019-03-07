"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _slicedToArrayLoose;

var _arrayWithHoles = _interopRequireDefault(require("./arrayWithHoles"));

var _iterableToArrayLimitLoose = _interopRequireDefault(require("./iterableToArrayLimitLoose"));

var _nonIterableRest = _interopRequireDefault(require("./nonIterableRest"));

function _slicedToArrayLoose(arr, i) {
  return (0, _arrayWithHoles["default"])(arr) || (0, _iterableToArrayLimitLoose["default"])(arr, i) || (0, _nonIterableRest["default"])();
}