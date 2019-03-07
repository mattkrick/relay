"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = toBlock;

var _generated = require("./generated");

var _generated2 = require("./generated");

function toBlock(node, parent) {
  if ((0, _generated.isBlockStatement)(node)) {
    return node;
  }

  var blockNodes = [];

  if ((0, _generated.isEmptyStatement)(node)) {
    blockNodes = [];
  } else {
    if (!(0, _generated.isStatement)(node)) {
      if ((0, _generated.isFunction)(parent)) {
        node = (0, _generated2.returnStatement)(node);
      } else {
        node = (0, _generated2.expressionStatement)(node);
      }
    }

    blockNodes = [node];
  }

  return (0, _generated2.blockStatement)(blockNodes);
}