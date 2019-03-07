"use strict";

var util = require("util");

var stringifyValidator = require("./stringifyValidator");

var toFunctionName = require("./toFunctionName");

var types = require("./..");

var readme = ["# @babel/types\n\n> This module contains methods for building ASTs manually and for checking the types of AST nodes.\n\n## Install\n\n```sh\nnpm install --save-dev @babel/types\n```\n\n## API"];
var customTypes = {
  ClassMethod: {
    key: "if computed then `Expression` else `Identifier | Literal`"
  },
  Identifier: {
    name: "`string`"
  },
  MemberExpression: {
    property: "if computed then `Expression` else `Identifier`"
  },
  ObjectMethod: {
    key: "if computed then `Expression` else `Identifier | Literal`"
  },
  ObjectProperty: {
    key: "if computed then `Expression` else `Identifier | Literal`"
  }
};
Object.keys(types.BUILDER_KEYS).sort().forEach(function (key) {
  readme.push("### " + key[0].toLowerCase() + key.substr(1));
  readme.push("```javascript");
  readme.push("t." + toFunctionName(key) + "(" + types.BUILDER_KEYS[key].join(", ") + ")");
  readme.push("```");
  readme.push("");
  readme.push("See also `t.is" + key + "(node, opts)` and `t.assert" + key + "(node, opts)`.");
  readme.push("");

  if (types.ALIAS_KEYS[key] && types.ALIAS_KEYS[key].length) {
    readme.push("Aliases: " + types.ALIAS_KEYS[key].map(function (key) {
      return "`" + key + "`";
    }).join(", "));
    readme.push("");
  }

  Object.keys(types.NODE_FIELDS[key]).sort(function (fieldA, fieldB) {
    var indexA = types.BUILDER_KEYS[key].indexOf(fieldA);
    var indexB = types.BUILDER_KEYS[key].indexOf(fieldB);
    if (indexA === indexB) return fieldA < fieldB ? -1 : 1;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  }).forEach(function (field) {
    var defaultValue = types.NODE_FIELDS[key][field]["default"];
    var fieldDescription = ["`" + field + "`"];
    var validator = types.NODE_FIELDS[key][field].validate;

    if (customTypes[key] && customTypes[key][field]) {
      fieldDescription.push(": ".concat(customTypes[key][field]));
    } else if (validator) {
      try {
        fieldDescription.push(": `" + stringifyValidator(validator, "") + "`");
      } catch (ex) {
        if (ex.code === "UNEXPECTED_VALIDATOR_TYPE") {
          console.log("Unrecognised validator type for " + key + "." + field);
          console.dir(ex.validator, {
            depth: 10,
            colors: true
          });
        }
      }
    }

    if (defaultValue !== null || types.NODE_FIELDS[key][field].optional) {
      fieldDescription.push(" (default: `" + util.inspect(defaultValue) + "`)");
    } else {
      fieldDescription.push(" (required)");
    }

    readme.push(" - " + fieldDescription.join(""));
  });
  readme.push("");
  readme.push("---");
  readme.push("");
});
process.stdout.write(readme.join("\n"));