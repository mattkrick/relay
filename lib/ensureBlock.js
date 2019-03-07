"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ensureBlock;

var _toBlock = _interopRequireDefault(require("./toBlock"));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

function ensureBlock(node) {
  var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "body";
  return node[key] = (0, _toBlock["default"])(node[key], node);
}