"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var types_1 = require("@babel/types");

function convertImportDeclaration(path) {
  //tslint:disable:no-any
  if (path.node.importKind === null) return path.node;
  var ret = types_1.importDeclaration(path.node.specifiers, path.node.source); //tslint:disable:no-any

  ret.importKind = null;
  return ret;
}

exports.convertImportDeclaration = convertImportDeclaration;