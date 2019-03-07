"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var convert_opaque_type_1 = require("./convert_opaque_type");

function OpaqueType(path) {
  path.replaceWith(convert_opaque_type_1.convertOpaqueType(path));
}

exports.OpaqueType = OpaqueType;