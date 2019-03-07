"use strict";

module.exports = function toFunctionName(typeName) {
  var _ = typeName.replace(/^TS/, "ts").replace(/^JSX/, "jsx");

  return _.slice(0, 1).toLowerCase() + _.slice(1);
};