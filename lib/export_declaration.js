"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var convert_export_declaration_1 = require("./convert_export_declaration");

function ExportDeclaration(path) {
  path.replaceWith(convert_export_declaration_1.convertEmportDeclaration(path));
}

exports.ExportDeclaration = ExportDeclaration;