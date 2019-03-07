"use strict";

var definitions = require("./definitions");

module.exports = function generateConstants() {
  var output = "// @flow\n/*\n * This file is auto-generated! Do not modify it directly.\n * To re-generate run 'make build'\n */\nimport { FLIPPED_ALIAS_KEYS } from \"../../definitions\";\n\n";
  Object.keys(definitions.FLIPPED_ALIAS_KEYS).forEach(function (type) {
    output += "export const ".concat(type.toUpperCase(), "_TYPES = FLIPPED_ALIAS_KEYS[\"").concat(type, "\"];\n");
  });
  return output;
};