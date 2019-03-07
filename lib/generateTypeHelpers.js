"use strict";

var fs = require("fs");

var path = require("path");

var chalk = require("chalk");

var generateBuilders = require("./generateBuilders");

var generateValidators = require("./generateValidators");

var generateAsserts = require("./generateAsserts");

var generateConstants = require("./generateConstants");

var format = require("./formatCode");

var baseDir = path.join(__dirname, "../src");

function writeFile(content, location) {
  var file = path.join(baseDir, location);

  try {
    fs.mkdirSync(path.dirname(file));
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }

  fs.writeFileSync(file, format(content, file));
}

console.log("Generating @babel/types dynamic functions");
writeFile(generateBuilders(), "builders/generated/index.js");
console.log("  ".concat(chalk.green("✔"), " Generated builders"));
writeFile(generateValidators(), "validators/generated/index.js");
console.log("  ".concat(chalk.green("✔"), " Generated validators"));
writeFile(generateAsserts(), "asserts/generated/index.js");
console.log("  ".concat(chalk.green("✔"), " Generated asserts"));
writeFile(generateConstants(), "constants/generated/index.js");
console.log("  ".concat(chalk.green("✔"), " Generated constants"));