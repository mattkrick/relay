"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _awaitAsyncGenerator;

var _AwaitValue = _interopRequireDefault(require("./AwaitValue"));

function _awaitAsyncGenerator(value) {
  return new _AwaitValue["default"](value);
}