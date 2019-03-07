"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = prependToMemberExpression;

var _generated = require("./generated");

function prependToMemberExpression(member, prepend) {
  member.object = (0, _generated.memberExpression)(prepend, member.object);
  return member;
}