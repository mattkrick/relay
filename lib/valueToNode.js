"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = valueToNode;

function _isPlainObject() {
  var data = _interopRequireDefault(require("./isPlainObject"));

  _isPlainObject = function _isPlainObject() {
    return data;
  };

  return data;
}

function _isRegExp() {
  var data = _interopRequireDefault(require("./isRegExp"));

  _isRegExp = function _isRegExp() {
    return data;
  };

  return data;
}

var _isValidIdentifier = _interopRequireDefault(require("./isValidIdentifier"));

var _generated = require("./generated");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

function valueToNode(value) {
  if (value === undefined) {
    return (0, _generated.identifier)("undefined");
  }

  if (value === true || value === false) {
    return (0, _generated.booleanLiteral)(value);
  }

  if (value === null) {
    return (0, _generated.nullLiteral)();
  }

  if (typeof value === "string") {
    return (0, _generated.stringLiteral)(value);
  }

  if (typeof value === "number") {
    var result;

    if (Number.isFinite(value)) {
      result = (0, _generated.numericLiteral)(Math.abs(value));
    } else {
      var numerator;

      if (Number.isNaN(value)) {
        numerator = (0, _generated.numericLiteral)(0);
      } else {
        numerator = (0, _generated.numericLiteral)(1);
      }

      result = (0, _generated.binaryExpression)("/", numerator, (0, _generated.numericLiteral)(0));
    }

    if (value < 0 || Object.is(value, -0)) {
      result = (0, _generated.unaryExpression)("-", result);
    }

    return result;
  }

  if ((0, _isRegExp()["default"])(value)) {
    var pattern = value.source;
    var flags = value.toString().match(/\/([a-z]+|)$/)[1];
    return (0, _generated.regExpLiteral)(pattern, flags);
  }

  if (Array.isArray(value)) {
    return (0, _generated.arrayExpression)(value.map(valueToNode));
  }

  if ((0, _isPlainObject()["default"])(value)) {
    var props = [];

    for (var key in value) {
      var nodeKey = void 0;

      if ((0, _isValidIdentifier["default"])(key)) {
        nodeKey = (0, _generated.identifier)(key);
      } else {
        nodeKey = (0, _generated.stringLiteral)(key);
      }

      props.push((0, _generated.objectProperty)(nodeKey, valueToNode(value[key])));
    }

    return (0, _generated.objectExpression)(props);
  }

  throw new Error("don't know how to turn this value into a node");
}