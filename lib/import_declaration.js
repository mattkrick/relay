"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var convert_import_declaration_1 = require("./convert_import_declaration");

function ImportDeclaration(path) {
  path.replaceWith(convert_import_declaration_1.convertImportDeclaration(path));
}

exports.ImportDeclaration = ImportDeclaration;

function ImportSpecifier(path) {
  path.node.importKind = null;
}

exports.ImportSpecifier = ImportSpecifier;