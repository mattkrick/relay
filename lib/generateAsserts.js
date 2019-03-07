"use strict";

var definitions = require("./definitions");

function addAssertHelper(type) {
  return "export function assert".concat(type, "(node: Object, opts?: Object = {}): void {\n    assert(\"").concat(type, "\", node, opts) }\n  ");
}

module.exports = function generateAsserts() {
  var output = "// @flow\n/*\n * This file is auto-generated! Do not modify it directly.\n * To re-generate run 'make build'\n */\nimport is from \"../../validators/is\";\n\nfunction assert(type: string, node: Object, opts?: Object): void {\n  if (!is(type, node, opts)) {\n    throw new Error(\n      `Expected type \"${type}\" with option ${JSON.stringify(opts)}, but instead got \"${node.type}\".`,\n    );\n  }\n}\n\n";
  Object.keys(definitions.VISITOR_KEYS).forEach(function (type) {
    output += addAssertHelper(type);
  });
  Object.keys(definitions.FLIPPED_ALIAS_KEYS).forEach(function (type) {
    output += addAssertHelper(type);
  });
  Object.keys(definitions.DEPRECATED_KEYS).forEach(function (type) {
    var newType = definitions.DEPRECATED_KEYS[type];
    output += "export function assert".concat(type, "(node: Object, opts: Object): void {\n  console.trace(\"The node type ").concat(type, " has been renamed to ").concat(newType, "\");\n  assert(\"").concat(type, "\", node, opts);\n}\n");
  });
  return output;
};