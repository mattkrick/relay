"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = traverse;

var _definitions = require("./definitions");

function traverse(node, handlers, state) {
  if (typeof handlers === "function") {
    handlers = {
      enter: handlers
    };
  }

  var _handlers = handlers,
      enter = _handlers.enter,
      exit = _handlers.exit;
  traverseSimpleImpl(node, enter, exit, state, []);
}

function traverseSimpleImpl(node, enter, exit, state, ancestors) {
  var keys = _definitions.VISITOR_KEYS[node.type];
  if (!keys) return;
  if (enter) enter(node, ancestors, state);
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var key = _step.value;
      var subNode = node[key];

      if (Array.isArray(subNode)) {
        for (var i = 0; i < subNode.length; i++) {
          var child = subNode[i];
          if (!child) continue;
          ancestors.push({
            node: node,
            key: key,
            index: i
          });
          traverseSimpleImpl(child, enter, exit, state, ancestors);
          ancestors.pop();
        }
      } else if (subNode) {
        ancestors.push({
          node: node,
          key: key
        });
        traverseSimpleImpl(subNode, enter, exit, state, ancestors);
        ancestors.pop();
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

  if (exit) exit(node, ancestors, state);
}