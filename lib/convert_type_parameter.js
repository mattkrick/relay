"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var types_1 = require("@babel/types");

var convert_flow_type_1 = require("./convert_flow_type");

function convertTypeParameter(path) {
  var tsNode = types_1.tsTypeParameter();
  if (path.node.bound) tsNode.constraint = convert_flow_type_1.convertFlowType(path.get('bound').get('typeAnnotation'));
  tsNode.name = path.node.name;
  return tsNode;
}

exports.convertTypeParameter = convertTypeParameter;