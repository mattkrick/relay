"use strict";

var definitions = require("./definitions");

var formatBuilderName = require("./formatBuilderName");

var lowerFirst = require("./lowerFirst");

module.exports = function generateBuilders() {
  var output = "// @flow\n/*\n * This file is auto-generated! Do not modify it directly.\n * To re-generate run 'make build'\n */\nimport builder from \"../builder\";\n\n";
  Object.keys(definitions.BUILDER_KEYS).forEach(function (type) {
    output += "export function ".concat(type, "(...args: Array<any>): Object { return builder(\"").concat(type, "\", ...args); }\nexport { ").concat(type, " as ").concat(formatBuilderName(type), " };\n"); // This is needed for backwards compatibility.
    // It should be removed in the next major version.
    // JSXIdentifier -> jSXIdentifier

    if (/^[A-Z]{2}/.test(type)) {
      output += "export { ".concat(type, " as ").concat(lowerFirst(type), " }\n");
    }
  });
  Object.keys(definitions.DEPRECATED_KEYS).forEach(function (type) {
    var newType = definitions.DEPRECATED_KEYS[type];
    output += "export function ".concat(type, "(...args: Array<any>): Object {\n  console.trace(\"The node type ").concat(type, " has been renamed to ").concat(newType, "\");\n  return ").concat(type, "(\"").concat(type, "\", ...args);\n}\nexport { ").concat(type, " as ").concat(formatBuilderName(type), " };\n"); // This is needed for backwards compatibility.
    // It should be removed in the next major version.
    // JSXIdentifier -> jSXIdentifier

    if (/^[A-Z]{2}/.test(type)) {
      output += "export { ".concat(type, " as ").concat(lowerFirst(type), " }\n");
    }
  });
  return output;
};