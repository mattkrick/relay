"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.matchesPattern = matchesPattern;
exports.has = has;
exports.isStatic = isStatic;
exports.isnt = isnt;
exports.equals = equals;
exports.isNodeType = isNodeType;
exports.canHaveVariableDeclarationOrExpression = canHaveVariableDeclarationOrExpression;
exports.canSwapBetweenExpressionAndStatement = canSwapBetweenExpressionAndStatement;
exports.isCompletionRecord = isCompletionRecord;
exports.isStatementOrBlock = isStatementOrBlock;
exports.referencesImport = referencesImport;
exports.getSource = getSource;
exports.willIMaybeExecuteBefore = willIMaybeExecuteBefore;
exports._guessExecutionStatusRelativeTo = _guessExecutionStatusRelativeTo;
exports._guessExecutionStatusRelativeToDifferentFunctions = _guessExecutionStatusRelativeToDifferentFunctions;
exports.resolve = resolve;
exports._resolve = _resolve;
exports.isConstantExpression = isConstantExpression;
exports.isInStrictMode = isInStrictMode;
exports.is = void 0;

function _includes() {
  var data = _interopRequireDefault(require("./includes"));

  _includes = function _includes() {
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

function matchesPattern(pattern, allowPartial) {
  return t().matchesPattern(this.node, pattern, allowPartial);
}

function has(key) {
  var val = this.node && this.node[key];

  if (val && Array.isArray(val)) {
    return !!val.length;
  } else {
    return !!val;
  }
}

function isStatic() {
  return this.scope.isStatic(this.node);
}

var is = has;
exports.is = is;

function isnt(key) {
  return !this.has(key);
}

function equals(key, value) {
  return this.node[key] === value;
}

function isNodeType(type) {
  return t().isType(this.type, type);
}

function canHaveVariableDeclarationOrExpression() {
  return (this.key === "init" || this.key === "left") && this.parentPath.isFor();
}

function canSwapBetweenExpressionAndStatement(replacement) {
  if (this.key !== "body" || !this.parentPath.isArrowFunctionExpression()) {
    return false;
  }

  if (this.isExpression()) {
    return t().isBlockStatement(replacement);
  } else if (this.isBlockStatement()) {
    return t().isExpression(replacement);
  }

  return false;
}

function isCompletionRecord(allowInsideFunction) {
  var path = this;
  var first = true;

  do {
    var container = path.container;

    if (path.isFunction() && !first) {
      return !!allowInsideFunction;
    }

    first = false;

    if (Array.isArray(container) && path.key !== container.length - 1) {
      return false;
    }
  } while ((path = path.parentPath) && !path.isProgram());

  return true;
}

function isStatementOrBlock() {
  if (this.parentPath.isLabeledStatement() || t().isBlockStatement(this.container)) {
    return false;
  } else {
    return (0, _includes()["default"])(t().STATEMENT_OR_BLOCK_KEYS, this.key);
  }
}

function referencesImport(moduleSource, importName) {
  if (!this.isReferencedIdentifier()) return false;
  var binding = this.scope.getBinding(this.node.name);
  if (!binding || binding.kind !== "module") return false;
  var path = binding.path;
  var parent = path.parentPath;
  if (!parent.isImportDeclaration()) return false;

  if (parent.node.source.value === moduleSource) {
    if (!importName) return true;
  } else {
    return false;
  }

  if (path.isImportDefaultSpecifier() && importName === "default") {
    return true;
  }

  if (path.isImportNamespaceSpecifier() && importName === "*") {
    return true;
  }

  if (path.isImportSpecifier() && path.node.imported.name === importName) {
    return true;
  }

  return false;
}

function getSource() {
  var node = this.node;

  if (node.end) {
    var code = this.hub.getCode();
    if (code) return code.slice(node.start, node.end);
  }

  return "";
}

function willIMaybeExecuteBefore(target) {
  return this._guessExecutionStatusRelativeTo(target) !== "after";
}

function _guessExecutionStatusRelativeTo(target) {
  var targetFuncParent = target.scope.getFunctionParent() || target.scope.getProgramParent();
  var selfFuncParent = this.scope.getFunctionParent() || target.scope.getProgramParent();

  if (targetFuncParent.node !== selfFuncParent.node) {
    var status = this._guessExecutionStatusRelativeToDifferentFunctions(targetFuncParent);

    if (status) {
      return status;
    } else {
      target = targetFuncParent.path;
    }
  }

  var targetPaths = target.getAncestry();
  if (targetPaths.indexOf(this) >= 0) return "after";
  var selfPaths = this.getAncestry();
  var commonPath;
  var targetIndex;
  var selfIndex;

  for (selfIndex = 0; selfIndex < selfPaths.length; selfIndex++) {
    var selfPath = selfPaths[selfIndex];
    targetIndex = targetPaths.indexOf(selfPath);

    if (targetIndex >= 0) {
      commonPath = selfPath;
      break;
    }
  }

  if (!commonPath) {
    return "before";
  }

  var targetRelationship = targetPaths[targetIndex - 1];
  var selfRelationship = selfPaths[selfIndex - 1];

  if (!targetRelationship || !selfRelationship) {
    return "before";
  }

  if (targetRelationship.listKey && targetRelationship.container === selfRelationship.container) {
    return targetRelationship.key > selfRelationship.key ? "before" : "after";
  }

  var keys = t().VISITOR_KEYS[commonPath.type];
  var targetKeyPosition = keys.indexOf(targetRelationship.key);
  var selfKeyPosition = keys.indexOf(selfRelationship.key);
  return targetKeyPosition > selfKeyPosition ? "before" : "after";
}

function _guessExecutionStatusRelativeToDifferentFunctions(targetFuncParent) {
  var targetFuncPath = targetFuncParent.path;
  if (!targetFuncPath.isFunctionDeclaration()) return;
  var binding = targetFuncPath.scope.getBinding(targetFuncPath.node.id.name);
  if (!binding.references) return "before";
  var referencePaths = binding.referencePaths;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = referencePaths[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var path = _step.value;

      if (path.key !== "callee" || !path.parentPath.isCallExpression()) {
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

  var allStatus;
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = referencePaths[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _path = _step2.value;
      var childOfFunction = !!_path.find(function (path) {
        return path.node === targetFuncPath.node;
      });
      if (childOfFunction) continue;

      var status = this._guessExecutionStatusRelativeTo(_path);

      if (allStatus) {
        if (allStatus !== status) return;
      } else {
        allStatus = status;
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

  return allStatus;
}

function resolve(dangerous, resolved) {
  return this._resolve(dangerous, resolved) || this;
}

function _resolve(dangerous, resolved) {
  if (resolved && resolved.indexOf(this) >= 0) return;
  resolved = resolved || [];
  resolved.push(this);

  if (this.isVariableDeclarator()) {
    if (this.get("id").isIdentifier()) {
      return this.get("init").resolve(dangerous, resolved);
    } else {}
  } else if (this.isReferencedIdentifier()) {
    var binding = this.scope.getBinding(this.node.name);
    if (!binding) return;
    if (!binding.constant) return;
    if (binding.kind === "module") return;

    if (binding.path !== this) {
      var ret = binding.path.resolve(dangerous, resolved);
      if (this.find(function (parent) {
        return parent.node === ret.node;
      })) return;
      return ret;
    }
  } else if (this.isTypeCastExpression()) {
    return this.get("expression").resolve(dangerous, resolved);
  } else if (dangerous && this.isMemberExpression()) {
    var targetKey = this.toComputedKey();
    if (!t().isLiteral(targetKey)) return;
    var targetName = targetKey.value;
    var target = this.get("object").resolve(dangerous, resolved);

    if (target.isObjectExpression()) {
      var props = target.get("properties");
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = props[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var prop = _step3.value;
          if (!prop.isProperty()) continue;
          var key = prop.get("key");
          var match = prop.isnt("computed") && key.isIdentifier({
            name: targetName
          });
          match = match || key.isLiteral({
            value: targetName
          });
          if (match) return prop.get("value").resolve(dangerous, resolved);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
            _iterator3["return"]();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    } else if (target.isArrayExpression() && !isNaN(+targetName)) {
      var elems = target.get("elements");
      var elem = elems[targetName];
      if (elem) return elem.resolve(dangerous, resolved);
    }
  }
}

function isConstantExpression() {
  if (this.isIdentifier()) {
    var binding = this.scope.getBinding(this.node.name);
    if (!binding) return false;
    return binding.constant;
  }

  if (this.isLiteral()) {
    if (this.isRegExpLiteral()) {
      return false;
    }

    if (this.isTemplateLiteral()) {
      return this.get("expressions").every(function (expression) {
        return expression.isConstantExpression();
      });
    }

    return true;
  }

  if (this.isUnaryExpression()) {
    if (this.get("operator").node !== "void") {
      return false;
    }

    return this.get("argument").isConstantExpression();
  }

  if (this.isBinaryExpression()) {
    return this.get("left").isConstantExpression() && this.get("right").isConstantExpression();
  }

  return false;
}

function isInStrictMode() {
  var start = this.isProgram() ? this : this.parentPath;
  var strictParent = start.find(function (path) {
    if (path.isProgram({
      sourceType: "module"
    })) return true;
    if (path.isClass()) return true;
    if (!path.isProgram() && !path.isFunction()) return false;

    if (path.isArrowFunctionExpression() && !path.get("body").isBlockStatement()) {
      return false;
    }

    var node = path.node;
    if (path.isFunction()) node = node.body;
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = node.directives[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var directive = _step4.value;

        if (directive.value.value === "use strict") {
          return true;
        }
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
          _iterator4["return"]();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }
  });
  return !!strictParent;
}