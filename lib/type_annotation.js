"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var convert_type_annotation_1 = require("./convert_type_annotation");

function TypeAnnotation(path) {
  path.replaceWith(convert_type_annotation_1.convertTypeAnnotation(path));
}

exports.TypeAnnotation = TypeAnnotation;

function TypeAlias(path) {
  path.replaceWith(convert_type_annotation_1.convertTypeAlias(path));
}

exports.TypeAlias = TypeAlias;