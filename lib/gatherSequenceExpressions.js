"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = gatherSequenceExpressions;

var _getBindingIdentifiers = _interopRequireDefault(require("./getBindingIdentifiers"));

var _generated = require("./generated");

var _generated2 = require("./generated");

var _cloneNode = _interopRequireDefault(require("./cloneNode"));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

function gatherSequenceExpressions(nodes, scope, declars) {
  var exprs = [];
  var ensureLastUndefined = true;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = nodes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var node = _step.value;
      ensureLastUndefined = false;

      if ((0, _generated.isExpression)(node)) {
        exprs.push(node);
      } else if ((0, _generated.isExpressionStatement)(node)) {
        exprs.push(node.expression);
      } else if ((0, _generated.isVariableDeclaration)(node)) {
        if (node.kind !== "var") return;
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = node.declarations[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var declar = _step2.value;
            var bindings = (0, _getBindingIdentifiers["default"])(declar);

            for (var key in bindings) {
              declars.push({
                kind: node.kind,
                id: (0, _cloneNode["default"])(bindings[key])
              });
            }

            if (declar.init) {
              exprs.push((0, _generated2.assignmentExpression)("=", declar.id, declar.init));
            }
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

        ensureLastUndefined = true;
      } else if ((0, _generated.isIfStatement)(node)) {
        var consequent = node.consequent ? gatherSequenceExpressions([node.consequent], scope, declars) : scope.buildUndefinedNode();
        var alternate = node.alternate ? gatherSequenceExpressions([node.alternate], scope, declars) : scope.buildUndefinedNode();
        if (!consequent || !alternate) return;
        exprs.push((0, _generated2.conditionalExpression)(node.test, consequent, alternate));
      } else if ((0, _generated.isBlockStatement)(node)) {
        var body = gatherSequenceExpressions(node.body, scope, declars);
        if (!body) return;
        exprs.push(body);
      } else if ((0, _generated.isEmptyStatement)(node)) {
        ensureLastUndefined = true;
      } else {
        return;
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

  if (ensureLastUndefined) {
    exprs.push(scope.buildUndefinedNode());
  }

  if (exprs.length === 1) {
    return exprs[0];
  } else {
    return (0, _generated2.sequenceExpression)(exprs);
  }
}