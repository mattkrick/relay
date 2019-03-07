"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = inherits;

var _constants = require("./constants");

var _inheritsComments = _interopRequireDefault(require("./inheritsComments"));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

function inherits(child, parent) {
  if (!child || !parent) return child;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = _constants.INHERIT_KEYS.optional[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _key = _step.value;

      if (child[_key] == null) {
        child[_key] = parent[_key];
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  for (var key in parent) {
    if (key[0] === "_" && key !== "__clone") child[key] = parent[key];
  }

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = _constants.INHERIT_KEYS.force[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _key2 = _step2.value;
      child[_key2] = parent[_key2];
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
        _iterator2["return"]();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  (0, _inheritsComments["default"])(child, parent);
  return child;
}