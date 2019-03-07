"use strict";

var _interopRequireDefault2 = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault2(require("@babel/runtime/helpers/toConsumableArray"));

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.insertBefore = insertBefore;
exports._containerInsert = _containerInsert;
exports._containerInsertBefore = _containerInsertBefore;
exports._containerInsertAfter = _containerInsertAfter;
exports.insertAfter = insertAfter;
exports.updateSiblingKeys = updateSiblingKeys;
exports._verifyNodeList = _verifyNodeList;
exports.unshiftContainer = unshiftContainer;
exports.pushContainer = pushContainer;
exports.hoist = hoist;

var _cache = require("./cache");

var _hoister = _interopRequireDefault(require("./hoister"));

var _index = _interopRequireDefault(require("./index"));

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

function insertBefore(nodes) {
  this._assertUnremoved();

  nodes = this._verifyNodeList(nodes);
  var parentPath = this.parentPath;

  if (parentPath.isExpressionStatement() || parentPath.isLabeledStatement() || parentPath.isExportNamedDeclaration() || parentPath.isExportDefaultDeclaration() && this.isDeclaration()) {
    return parentPath.insertBefore(nodes);
  } else if (this.isNodeType("Expression") && this.listKey !== "params" && this.listKey !== "arguments" || parentPath.isForStatement() && this.key === "init") {
    if (this.node) nodes.push(this.node);
    return this.replaceExpressionWithStatements(nodes);
  } else if (Array.isArray(this.container)) {
    return this._containerInsertBefore(nodes);
  } else if (this.isStatementOrBlock()) {
    var shouldInsertCurrentNode = this.node && (!this.isExpressionStatement() || this.node.expression != null);
    this.replaceWith(t().blockStatement(shouldInsertCurrentNode ? [this.node] : []));
    return this.unshiftContainer("body", nodes);
  } else {
    throw new Error("We don't know what to do with this node type. " + "We were previously a Statement but we can't fit in here?");
  }
}

function _containerInsert(from, nodes) {
  var _this$container;

  this.updateSiblingKeys(from, nodes.length);
  var paths = [];

  (_this$container = this.container).splice.apply(_this$container, [from, 0].concat((0, _toConsumableArray2["default"])(nodes)));

  for (var i = 0; i < nodes.length; i++) {
    var to = from + i;
    var path = this.getSibling(to);
    paths.push(path);

    if (this.context && this.context.queue) {
      path.pushContext(this.context);
    }
  }

  var contexts = this._getQueueContexts();

  for (var _i = 0; _i < paths.length; _i++) {
    var _path = paths[_i];

    _path.setScope();

    _path.debug("Inserted.");

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = contexts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var context = _step.value;
        context.maybeQueue(_path, true);
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
  }

  return paths;
}

function _containerInsertBefore(nodes) {
  return this._containerInsert(this.key, nodes);
}

function _containerInsertAfter(nodes) {
  return this._containerInsert(this.key + 1, nodes);
}

function insertAfter(nodes) {
  this._assertUnremoved();

  nodes = this._verifyNodeList(nodes);
  var parentPath = this.parentPath;

  if (parentPath.isExpressionStatement() || parentPath.isLabeledStatement() || parentPath.isExportNamedDeclaration() || parentPath.isExportDefaultDeclaration() && this.isDeclaration()) {
    return parentPath.insertAfter(nodes.map(function (node) {
      return t().isExpression(node) ? t().expressionStatement(node) : node;
    }));
  } else if (this.isNodeType("Expression") && !this.isJSXElement() || parentPath.isForStatement() && this.key === "init") {
    if (this.node) {
      var scope = this.scope;

      if (parentPath.isMethod({
        computed: true,
        key: this.node
      })) {
        scope = scope.parent;
      }

      var temp = scope.generateDeclaredUidIdentifier();
      nodes.unshift(t().expressionStatement(t().assignmentExpression("=", t().cloneNode(temp), this.node)));
      nodes.push(t().expressionStatement(t().cloneNode(temp)));
    }

    return this.replaceExpressionWithStatements(nodes);
  } else if (Array.isArray(this.container)) {
    return this._containerInsertAfter(nodes);
  } else if (this.isStatementOrBlock()) {
    var shouldInsertCurrentNode = this.node && (!this.isExpressionStatement() || this.node.expression != null);
    this.replaceWith(t().blockStatement(shouldInsertCurrentNode ? [this.node] : []));
    return this.pushContainer("body", nodes);
  } else {
    throw new Error("We don't know what to do with this node type. " + "We were previously a Statement but we can't fit in here?");
  }
}

function updateSiblingKeys(fromIndex, incrementBy) {
  if (!this.parent) return;

  var paths = _cache.path.get(this.parent);

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];

    if (path.key >= fromIndex) {
      path.key += incrementBy;
    }
  }
}

function _verifyNodeList(nodes) {
  if (!nodes) {
    return [];
  }

  if (nodes.constructor !== Array) {
    nodes = [nodes];
  }

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var msg = void 0;

    if (!node) {
      msg = "has falsy node";
    } else if (typeof node !== "object") {
      msg = "contains a non-object node";
    } else if (!node.type) {
      msg = "without a type";
    } else if (node instanceof _index["default"]) {
      msg = "has a NodePath when it expected a raw object";
    }

    if (msg) {
      var type = Array.isArray(node) ? "array" : typeof node;
      throw new Error("Node list ".concat(msg, " with the index of ").concat(i, " and type of ").concat(type));
    }
  }

  return nodes;
}

function unshiftContainer(listKey, nodes) {
  this._assertUnremoved();

  nodes = this._verifyNodeList(nodes);

  var path = _index["default"].get({
    parentPath: this,
    parent: this.node,
    container: this.node[listKey],
    listKey: listKey,
    key: 0
  });

  return path.insertBefore(nodes);
}

function pushContainer(listKey, nodes) {
  this._assertUnremoved();

  nodes = this._verifyNodeList(nodes);
  var container = this.node[listKey];

  var path = _index["default"].get({
    parentPath: this,
    parent: this.node,
    container: container,
    listKey: listKey,
    key: container.length
  });

  return path.replaceWithMultiple(nodes);
}

function hoist() {
  var scope = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.scope;
  var hoister = new _hoister["default"](this, scope);
  return hoister.run();
}