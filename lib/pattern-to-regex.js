"use strict";

var _interopRequireDefault2 = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault2(require("@babel/runtime/helpers/toConsumableArray"));

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = pathToPattern;

function _path() {
  var data = _interopRequireDefault(require("path"));

  _path = function _path() {
    return data;
  };

  return data;
}

function _escapeRegExp() {
  var data = _interopRequireDefault(require("./escapeRegExp"));

  _escapeRegExp = function _escapeRegExp() {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

var sep = "\\".concat(_path()["default"].sep);
var endSep = "(?:".concat(sep, "|$)");
var substitution = "[^".concat(sep, "]+");
var starPat = "(?:".concat(substitution).concat(sep, ")");
var starPatLast = "(?:".concat(substitution).concat(endSep, ")");
var starStarPat = "".concat(starPat, "*?");
var starStarPatLast = "".concat(starPat, "*?").concat(starPatLast, "?");

function pathToPattern(pattern, dirname) {
  var parts = _path()["default"].resolve(dirname, pattern).split(_path()["default"].sep);

  return new RegExp(["^"].concat((0, _toConsumableArray2["default"])(parts.map(function (part, i) {
    var last = i === parts.length - 1;
    if (part === "**") return last ? starStarPatLast : starStarPat;
    if (part === "*") return last ? starPatLast : starPat;

    if (part.indexOf("*.") === 0) {
      return substitution + (0, _escapeRegExp()["default"])(part.slice(1)) + (last ? endSep : sep);
    }

    return (0, _escapeRegExp()["default"])(part) + (last ? endSep : sep);
  }))).join(""));
}