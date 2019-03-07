"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _wrapAsyncGenerator;

var _AsyncGenerator = _interopRequireDefault(require("./AsyncGenerator"));

function _wrapAsyncGenerator(fn) {
  return function () {
    return new _AsyncGenerator["default"](fn.apply(this, arguments));
  };
}