"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = addComments;

function addComments(node, type, comments) {
  if (!comments || !node) return node;
  var key = "".concat(type, "Comments");

  if (node[key]) {
    if (type === "leading") {
      node[key] = comments.concat(node[key]);
    } else {
      node[key] = node[key].concat(comments);
    }
  } else {
    node[key] = comments;
  }

  return node;
}