"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var types_1 = require("@babel/types");

var convert_flow_type_1 = require("./convert_flow_type");

var convert_type_parameter_declaration_1 = require("./convert_type_parameter_declaration");

function convertTypeAnnotation(path) {
  return types_1.tsTypeAnnotation(convert_flow_type_1.convertFlowType(path.get('typeAnnotation')));
}

exports.convertTypeAnnotation = convertTypeAnnotation;

function convertTypeAlias(path) {
  var typeParameters = path.get('typeParameters');
  var right = path.get('right');
  return types_1.tsTypeAliasDeclaration(path.node.id, typeParameters.isTypeParameterDeclaration() ? convert_type_parameter_declaration_1.convertTypeParameterDeclaration(typeParameters) : null, convert_flow_type_1.convertFlowType(right));
}

exports.convertTypeAlias = convertTypeAlias;