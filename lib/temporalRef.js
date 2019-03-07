"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _temporalRef;

var _temporalUndefined = _interopRequireDefault(require("./temporalUndefined"));

function _temporalRef(val, name) {
  if (val === _temporalUndefined["default"]) {
    throw new ReferenceError(name + " is not defined - temporal dead zone");
  } else {
    return val;
  }
}