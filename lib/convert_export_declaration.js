"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function convertEmportDeclaration(path) {
  //tslint:disable:no-any
  path.node.exportKind = null;
  return path.node;
}

exports.convertEmportDeclaration = convertEmportDeclaration;