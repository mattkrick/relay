"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var convert_type_parameter_declaration_1 = require("./convert_type_parameter_declaration");

function TypeParameterDeclaration(path) {
  path.replaceWith(convert_type_parameter_declaration_1.convertTypeParameterDeclaration(path));
}

exports.TypeParameterDeclaration = TypeParameterDeclaration;