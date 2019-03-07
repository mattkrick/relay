"use strict";

var prettier = require("./prettier");

module.exports = function formatCode(code, filename) {
  filename = filename || __filename;
  var prettierConfig = prettier.resolveConfig.sync(filename);
  prettierConfig.filepath = filename;
  prettierConfig.parser = "babylon";
  return prettier.format(code, prettierConfig);
};