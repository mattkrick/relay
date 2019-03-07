"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = shallowEqual;

function shallowEqual(actual, expected) {
  var keys = Object.keys(expected);

  for (var _i = 0; _i < keys.length; _i++) {
    var key = keys[_i];

    if (actual[key] !== expected[key]) {
      return false;
    }
  }

  return true;
}