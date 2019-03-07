"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.replaceWithMultiple = replaceWithMultiple;
exports.replaceWithSourceString = replaceWithSourceString;
exports.replaceWith = replaceWith;
exports._replaceWith = _replaceWith;
exports.replaceExpressionWithStatements = replaceExpressionWithStatements;
exports.replaceInline = replaceInline;

function _codeFrame() {
  var data = require("./code-frame");

  _codeFrame = function _codeFrame() {
    return data;
  };

  return data;
}

var _index = _interopRequireDefault(require("./index"));

var _index2 = _interopRequireDefault(require("./index"));

function _parser() {
  var data = require("@babel/parser");

  _parser = function _parser() {
    return data;
  };

  return data;
}

function t() {
  var data = _interopRequireWildcard(require("@babel/types"));

  t = function t() {
    return data;
  };

  return data;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};

    if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};

          if (desc.get || desc.set) {
            Object.defineProperty(newObj, key, desc);
          } else {
            newObj[key] = obj[key];
          }
        }
      }
    }

    newObj["default"] = obj;
    return newObj;
  }
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

var hoistVariablesVisitor = {
  Function: function Function(path) {
    path.skip();
  },
  VariableDeclaration: function VariableDeclaration(path) {
    if (path.node.kind !== "var") return;
    var bindings = path.getBindingIdentifiers();

    for (var key in bindings) {
      path.scope.push({
        id: bindings[key]
      });
    }

    var exprs = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = path.node.declarations[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var declar = _step.value;

        if (declar.init) {
          exprs.push(t().expressionStatement(t().assignmentExpression("=", declar.id, declar.init)));
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

    path.replaceWithMultiple(exprs);
  }
};

function replaceWithMultiple(nodes) {
  this.resync();
  nodes = this._verifyNodeList(nodes);
  t().inheritLeadingComments(nodes[0], this.node);
  t().inheritTrailingComments(nodes[nodes.length - 1], this.node);
  this.node = this.container[this.key] = null;
  var paths = this.insertAfter(nodes);

  if (this.node) {
    this.requeue();
  } else {
    this.remove();
  }

  return paths;
}

function replaceWithSourceString(replacement) {
  this.resync();

  try {
    replacement = "(".concat(replacement, ")");
    replacement = (0, _parser().parse)(replacement);
  } catch (err) {
    var loc = err.loc;

    if (loc) {
      err.message += " - make sure this is an expression.\n" + (0, _codeFrame().codeFrameColumns)(replacement, {
        start: {
          line: loc.line,
          column: loc.column + 1
        }
      });
      err.code = "BABEL_REPLACE_SOURCE_ERROR";
    }

    throw err;
  }

  replacement = replacement.program.body[0].expression;

  _index["default"].removeProperties(replacement);

  return this.replaceWith(replacement);
}

function replaceWith(replacement) {
  this.resync();

  if (this.removed) {
    throw new Error("You can't replace this node, we've already removed it");
  }

  if (replacement instanceof _index2["default"]) {
    replacement = replacement.node;
  }

  if (!replacement) {
    throw new Error("You passed `path.replaceWith()` a falsy node, use `path.remove()` instead");
  }

  if (this.node === replacement) {
    return [this];
  }

  if (this.isProgram() && !t().isProgram(replacement)) {
    throw new Error("You can only replace a Program root node with another Program node");
  }

  if (Array.isArray(replacement)) {
    throw new Error("Don't use `path.replaceWith()` with an array of nodes, use `path.replaceWithMultiple()`");
  }

  if (typeof replacement === "string") {
    throw new Error("Don't use `path.replaceWith()` with a source string, use `path.replaceWithSourceString()`");
  }

  var nodePath = "";

  if (this.isNodeType("Statement") && t().isExpression(replacement)) {
    if (!this.canHaveVariableDeclarationOrExpression() && !this.canSwapBetweenExpressionAndStatement(replacement) && !this.parentPath.isExportDefaultDeclaration()) {
      replacement = t().expressionStatement(replacement);
      nodePath = "expression";
    }
  }

  if (this.isNodeType("Expression") && t().isStatement(replacement)) {
    if (!this.canHaveVariableDeclarationOrExpression() && !this.canSwapBetweenExpressionAndStatement(replacement)) {
      return this.replaceExpressionWithStatements([replacement]);
    }
  }

  var oldNode = this.node;

  if (oldNode) {
    t().inheritsComments(replacement, oldNode);
    t().removeComments(oldNode);
  }

  this._replaceWith(replacement);

  this.type = replacement.type;
  this.setScope();
  this.requeue();
  return [nodePath ? this.get(nodePath) : this];
}

function _replaceWith(node) {
  if (!this.container) {
    throw new ReferenceError("Container is falsy");
  }

  if (this.inList) {
    t().validate(this.parent, this.key, [node]);
  } else {
    t().validate(this.parent, this.key, node);
  }

  this.debug("Replace with ".concat(node && node.type));
  this.node = this.container[this.key] = node;
}

function replaceExpressionWithStatements(nodes) {
  this.resync();
  var toSequenceExpression = t().toSequenceExpression(nodes, this.scope);

  if (toSequenceExpression) {
    return this.replaceWith(toSequenceExpression)[0].get("expressions");
  }

  var container = t().arrowFunctionExpression([], t().blockStatement(nodes));
  this.replaceWith(t().callExpression(container, []));
  this.traverse(hoistVariablesVisitor);
  var completionRecords = this.get("callee").getCompletionRecords();
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = completionRecords[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var path = _step2.value;
      if (!path.isExpressionStatement()) continue;
      var loop = path.findParent(function (path) {
        return path.isLoop();
      });

      if (loop) {
        var uid = loop.getData("expressionReplacementReturnUid");

        if (!uid) {
          var _callee = this.get("callee");

          uid = _callee.scope.generateDeclaredUidIdentifier("ret");

          _callee.get("body").pushContainer("body", t().returnStatement(t().cloneNode(uid)));

          loop.setData("expressionReplacementReturnUid", uid);
        } else {
          uid = t().identifier(uid.name);
        }

        path.get("expression").replaceWith(t().assignmentExpression("=", t().cloneNode(uid), path.node.expression));
      } else {
        path.replaceWith(t().returnStatement(path.node.expression));
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

  var callee = this.get("callee");
  callee.arrowFunctionToExpression();
  return callee.get("body.body");
}

function replaceInline(nodes) {
  this.resync();

  if (Array.isArray(nodes)) {
    if (Array.isArray(this.container)) {
      nodes = this._verifyNodeList(nodes);

      var paths = this._containerInsertAfter(nodes);

      this.remove();
      return paths;
    } else {
      return this.replaceWithMultiple(nodes);
    }
  } else {
    return this.replaceWith(nodes);
  }
}