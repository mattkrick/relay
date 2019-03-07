"use strict";

var definitions = require("./definitions");

function addIsHelper(type, aliasKeys, deprecated) {
  var targetType = JSON.stringify(type);
  var aliasSource = "";

  if (aliasKeys) {
    aliasSource = " || " + aliasKeys.map(JSON.stringify).join(" === nodeType || ") + " === nodeType";
  }

  return "export function is".concat(type, "(node: Object, opts?: Object): boolean {\n    ").concat(deprecated || "", "\n    if (!node) return false;\n\n    const nodeType = node.type;\n    if (nodeType === ").concat(targetType).concat(aliasSource, ") {\n      if (typeof opts === \"undefined\") {\n        return true;\n      } else {\n        return shallowEqual(node, opts);\n      }\n    }\n\n    return false;\n  }\n  ");
}

module.exports = function generateValidators() {
  var output = "// @flow\n/*\n * This file is auto-generated! Do not modify it directly.\n * To re-generate run 'make build'\n */\nimport shallowEqual from \"../../utils/shallowEqual\";\n\n";
  Object.keys(definitions.VISITOR_KEYS).forEach(function (type) {
    output += addIsHelper(type);
  });
  Object.keys(definitions.FLIPPED_ALIAS_KEYS).forEach(function (type) {
    output += addIsHelper(type, definitions.FLIPPED_ALIAS_KEYS[type]);
  });
  Object.keys(definitions.DEPRECATED_KEYS).forEach(function (type) {
    var newType = definitions.DEPRECATED_KEYS[type];
    var deprecated = "console.trace(\"The node type ".concat(type, " has been renamed to ").concat(newType, "\");");
    output += addIsHelper(type, null, deprecated);
  });
  return output;
};