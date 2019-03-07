"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = appendToMemberExpression;

var _generated = require("./generated");

function appendToMemberExpression(member, append) {
  var computed = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  member.object = (0, _generated.memberExpression)(member.object, member.property, member.computed);
  member.property = append;
  member.computed = !!computed;
  return member;
}