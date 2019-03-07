"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var convert_type_cast_expression_1 = require("./convert_type_cast_expression");

function TypeCastExpression(path) {
  path.replaceWith(convert_type_cast_expression_1.convertTypeCastExpression(path));
}

exports.TypeCastExpression = TypeCastExpression;