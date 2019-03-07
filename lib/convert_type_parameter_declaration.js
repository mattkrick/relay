"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var types_1 = require("@babel/types");

var convert_type_parameter_1 = require("./convert_type_parameter");

function convertTypeParameterDeclaration(path) {
  var params = path.node.params.map(function (_, i) {
    return convert_type_parameter_1.convertTypeParameter(path.get("params.".concat(i)));
  });
  return types_1.tsTypeParameterDeclaration(params);
}

exports.convertTypeParameterDeclaration = convertTypeParameterDeclaration;