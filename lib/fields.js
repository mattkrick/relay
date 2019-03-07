"use strict";

var _interopRequireDefault2 = require("@babel/runtime/helpers/interopRequireDefault");

var _taggedTemplateLiteral2 = _interopRequireDefault2(require("./taggedTemplateLiteral"));

function _templateObject16() {
  var data = (0, _taggedTemplateLiteral2["default"])(["", ".add(", ")"]);

  _templateObject16 = function _templateObject16() {
    return data;
  };

  return data;
}

function _templateObject15() {
  var data = (0, _taggedTemplateLiteral2["default"])(["\n        ", ".set(", ", {\n          set: ", "\n        });\n      "]);

  _templateObject15 = function _templateObject15() {
    return data;
  };

  return data;
}

function _templateObject14() {
  var data = (0, _taggedTemplateLiteral2["default"])(["\n        ", ".set(", ", {\n          get: ", "\n        });\n      "]);

  _templateObject14 = function _templateObject14() {
    return data;
  };

  return data;
}

function _templateObject13() {
  var data = (0, _taggedTemplateLiteral2["default"])(["\n        ", ".set(", ", {\n          get: ", ",\n          set: ", "\n        });\n      "]);

  _templateObject13 = function _templateObject13() {
    return data;
  };

  return data;
}

function _templateObject12() {
  var data = (0, _taggedTemplateLiteral2["default"])(["\n        Object.defineProperty(", ", ", ", {\n          // configurable is false by default\n          // enumerable is false by default\n          // writable is false by default\n          set: ", "\n        });\n      "]);

  _templateObject12 = function _templateObject12() {
    return data;
  };

  return data;
}

function _templateObject11() {
  var data = (0, _taggedTemplateLiteral2["default"])(["\n        Object.defineProperty(", ", ", ", {\n          // configurable is false by default\n          // enumerable is false by default\n          // writable is false by default\n          get: ", "\n        });\n      "]);

  _templateObject11 = function _templateObject11() {
    return data;
  };

  return data;
}

function _templateObject10() {
  var data = (0, _taggedTemplateLiteral2["default"])(["\n        Object.defineProperty(", ", ", ", {\n          // configurable is false by default\n          // enumerable is false by default\n          // writable is false by default\n          get: ", ",\n          set: ", "\n        });\n      "]);

  _templateObject10 = function _templateObject10() {
    return data;
  };

  return data;
}

function _templateObject9() {
  var data = (0, _taggedTemplateLiteral2["default"])(["\n        Object.defineProperty(", ", ", ", {\n          // configurable is false by default\n          // enumerable is false by default\n          // writable is false by default\n          value: ", "\n        });\n      "]);

  _templateObject9 = function _templateObject9() {
    return data;
  };

  return data;
}

function _templateObject8() {
  var data = (0, _taggedTemplateLiteral2["default"])(["\n    var ", " = {\n      // configurable is false by default\n      // enumerable is false by default\n      writable: true,\n      value: ", "\n    };\n  "]);

  _templateObject8 = function _templateObject8() {
    return data;
  };

  return data;
}

function _templateObject7() {
  var data = (0, _taggedTemplateLiteral2["default"])(["", ".set(", ", {\n    // configurable is always false for private elements\n    // enumerable is always false for private elements\n    writable: true,\n    value: ", ",\n  })"]);

  _templateObject7 = function _templateObject7() {
    return data;
  };

  return data;
}

function _templateObject6() {
  var data = (0, _taggedTemplateLiteral2["default"])(["\n    Object.defineProperty(", ", ", ", {\n      // configurable is false by default\n      // enumerable is false by default\n      writable: true,\n      value: ", "\n    });\n  "]);

  _templateObject6 = function _templateObject6() {
    return data;
  };

  return data;
}

function _templateObject5() {
  var data = (0, _taggedTemplateLiteral2["default"])(["BASE(REF, PROP)[PROP]"]);

  _templateObject5 = function _templateObject5() {
    return data;
  };

  return data;
}

function _templateObject4() {
  var data = (0, _taggedTemplateLiteral2["default"])(["var ", " = new WeakMap();"]);

  _templateObject4 = function _templateObject4() {
    return data;
  };

  return data;
}

function _templateObject3() {
  var data = (0, _taggedTemplateLiteral2["default"])(["var ", " = new WeakSet();"]);

  _templateObject3 = function _templateObject3() {
    return data;
  };

  return data;
}

function _templateObject2() {
  var data = (0, _taggedTemplateLiteral2["default"])(["var ", " = new WeakMap();"]);

  _templateObject2 = function _templateObject2() {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = (0, _taggedTemplateLiteral2["default"])(["\n          var ", " = ", "(\"", "\")\n        "]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildPrivateNamesMap = buildPrivateNamesMap;
exports.buildPrivateNamesNodes = buildPrivateNamesNodes;
exports.transformPrivateNamesUsage = transformPrivateNamesUsage;
exports.buildFieldsInitNodes = buildFieldsInitNodes;

function _core() {
  var data = require("@babel/core");

  _core = function _core() {
    return data;
  };

  return data;
}

function _helperReplaceSupers() {
  var data = require("./helper-replace-supers");

  _helperReplaceSupers = function _helperReplaceSupers() {
    return data;
  };

  return data;
}

function _helperMemberExpressionToFunctions() {
  var data = _interopRequireDefault(require("./helper-member-expression-to-functions"));

  _helperMemberExpressionToFunctions = function _helperMemberExpressionToFunctions() {
    return data;
  };

  return data;
}

function _helperOptimiseCallExpression() {
  var data = _interopRequireDefault(require("./helper-optimise-call-expression"));

  _helperOptimiseCallExpression = function _helperOptimiseCallExpression() {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

function buildPrivateNamesMap(props) {
  var privateNamesMap = new Map();
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = props[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var prop = _step.value;
      var isPrivate = prop.isPrivate();
      var isMethod = !prop.isProperty();
      var isInstance = !prop.node["static"];

      if (isPrivate) {
        var name = prop.node.key.id.name;
        var update = privateNamesMap.has(name) ? privateNamesMap.get(name) : {
          id: prop.scope.generateUidIdentifier(name),
          "static": !isInstance,
          method: isMethod
        };

        if (prop.node.kind === "get") {
          update.getId = prop.scope.generateUidIdentifier("get_".concat(name));
        } else if (prop.node.kind === "set") {
          update.setId = prop.scope.generateUidIdentifier("set_".concat(name));
        } else if (prop.node.kind === "method" && isMethod && isInstance) {
          update.methodId = prop.scope.generateUidIdentifier(name);
        }

        privateNamesMap.set(name, update);
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

  return privateNamesMap;
}

function buildPrivateNamesNodes(privateNamesMap, loose, state) {
  var initNodes = [];
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = privateNamesMap[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _step2$value = _step2.value,
          name = _step2$value[0],
          value = _step2$value[1];
      var id = value.id,
          isStatic = value["static"],
          isMethod = value.method,
          getId = value.getId,
          setId = value.setId;

      if (loose) {
        initNodes.push(_core().template.statement.ast(_templateObject(), id, state.addHelper("classPrivateFieldLooseKey"), name));
      } else if (isMethod && !isStatic) {
        if (getId || setId) {
          initNodes.push(_core().template.statement.ast(_templateObject2(), id));
        } else {
          initNodes.push(_core().template.statement.ast(_templateObject3(), id));
        }
      } else if (!isStatic) {
        initNodes.push(_core().template.statement.ast(_templateObject4(), id));
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

  return initNodes;
}

var privateNameVisitor = {
  PrivateName: function PrivateName(path) {
    var privateNamesMap = this.privateNamesMap;
    var node = path.node,
        parentPath = path.parentPath;
    if (!parentPath.isMemberExpression({
      property: node
    })) return;
    if (!privateNamesMap.has(node.id.name)) return;
    this.handle(parentPath);
  },
  Class: function Class(path) {
    var privateNamesMap = this.privateNamesMap;
    var body = path.get("body.body");
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = body[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var prop = _step3.value;

        if (!prop.isPrivate()) {
          continue;
        }

        if (!privateNamesMap.has(prop.node.key.id.name)) continue;
        path.traverse(privateNameInnerVisitor, this);
        path.skip();
        break;
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
  }
};

var privateNameInnerVisitor = _core().traverse.visitors.merge([{
  PrivateName: privateNameVisitor.PrivateName
}, _helperReplaceSupers().environmentVisitor]);

var privateNameHandlerSpec = {
  memoise: function memoise(member, count) {
    var scope = member.scope;
    var object = member.node.object;
    var memo = scope.maybeGenerateMemoised(object);

    if (!memo) {
      return;
    }

    this.memoiser.set(object, memo, count);
  },
  receiver: function receiver(member) {
    var object = member.node.object;

    if (this.memoiser.has(object)) {
      return _core().types.cloneNode(this.memoiser.get(object));
    }

    return _core().types.cloneNode(object);
  },
  get: function get(member) {
    var classRef = this.classRef,
        privateNamesMap = this.privateNamesMap,
        file = this.file;
    var name = member.node.property.id.name;

    var _privateNamesMap$get = privateNamesMap.get(name),
        id = _privateNamesMap$get.id,
        isStatic = _privateNamesMap$get["static"],
        isMethod = _privateNamesMap$get.method,
        methodId = _privateNamesMap$get.methodId,
        getId = _privateNamesMap$get.getId,
        setId = _privateNamesMap$get.setId;

    if (isStatic && !isMethod) {
      return _core().types.callExpression(file.addHelper("classStaticPrivateFieldSpecGet"), [this.receiver(member), _core().types.cloneNode(classRef), _core().types.cloneNode(id)]);
    }

    if (isMethod) {
      if (getId || setId) {
        return _core().types.callExpression(file.addHelper("classPrivateFieldGet"), [this.receiver(member), _core().types.cloneNode(id)]);
      }

      return _core().types.callExpression(file.addHelper("classPrivateMethodGet"), [this.receiver(member), _core().types.cloneNode(id), _core().types.cloneNode(methodId)]);
    }

    return _core().types.callExpression(file.addHelper("classPrivateFieldGet"), [this.receiver(member), _core().types.cloneNode(id)]);
  },
  set: function set(member, value) {
    var classRef = this.classRef,
        privateNamesMap = this.privateNamesMap,
        file = this.file;
    var name = member.node.property.id.name;

    var _privateNamesMap$get2 = privateNamesMap.get(name),
        id = _privateNamesMap$get2.id,
        isStatic = _privateNamesMap$get2["static"],
        isMethod = _privateNamesMap$get2.method,
        setId = _privateNamesMap$get2.setId;

    if (isStatic && !isMethod) {
      return _core().types.callExpression(file.addHelper("classStaticPrivateFieldSpecSet"), [this.receiver(member), _core().types.cloneNode(classRef), _core().types.cloneNode(id), value]);
    }

    if (isMethod) {
      if (setId) {
        return _core().types.callExpression(file.addHelper("classPrivateFieldSet"), [this.receiver(member), _core().types.cloneNode(id), value]);
      }

      return _core().types.callExpression(file.addHelper("classPrivateMethodSet"), []);
    }

    return _core().types.callExpression(file.addHelper("classPrivateFieldSet"), [this.receiver(member), _core().types.cloneNode(id), value]);
  },
  call: function call(member, args) {
    this.memoise(member, 1);
    return (0, _helperOptimiseCallExpression()["default"])(this.get(member), this.receiver(member), args);
  }
};
var privateNameHandlerLoose = {
  handle: function handle(member) {
    var privateNamesMap = this.privateNamesMap,
        file = this.file;
    var object = member.node.object;
    var name = member.node.property.id.name;
    member.replaceWith(_core().template.expression(_templateObject5())({
      BASE: file.addHelper("classPrivateFieldLooseBase"),
      REF: object,
      PROP: privateNamesMap.get(name).id
    }));
  }
};

function transformPrivateNamesUsage(ref, path, privateNamesMap, loose, state) {
  var body = path.get("body");

  if (loose) {
    body.traverse(privateNameVisitor, Object.assign({
      privateNamesMap: privateNamesMap,
      file: state
    }, privateNameHandlerLoose));
  } else {
    (0, _helperMemberExpressionToFunctions()["default"])(body, privateNameVisitor, Object.assign({
      privateNamesMap: privateNamesMap,
      classRef: ref,
      file: state
    }, privateNameHandlerSpec));
  }
}

function buildPrivateFieldInitLoose(ref, prop, privateNamesMap) {
  var _privateNamesMap$get3 = privateNamesMap.get(prop.node.key.id.name),
      id = _privateNamesMap$get3.id;

  var value = prop.node.value || prop.scope.buildUndefinedNode();
  return _core().template.statement.ast(_templateObject6(), ref, id, value);
}

function buildPrivateInstanceFieldInitSpec(ref, prop, privateNamesMap) {
  var _privateNamesMap$get4 = privateNamesMap.get(prop.node.key.id.name),
      id = _privateNamesMap$get4.id;

  var value = prop.node.value || prop.scope.buildUndefinedNode();
  return _core().template.statement.ast(_templateObject7(), id, ref, value);
}

function buildPrivateStaticFieldInitSpec(prop, privateNamesMap) {
  var _privateNamesMap$get5 = privateNamesMap.get(prop.node.key.id.name),
      id = _privateNamesMap$get5.id;

  var value = prop.node.value || prop.scope.buildUndefinedNode();
  return _core().template.statement.ast(_templateObject8(), id, value);
}

function buildPrivateMethodInitLoose(ref, prop, privateNamesMap) {
  var privateName = privateNamesMap.get(prop.node.key.id.name);
  var methodId = privateName.methodId,
      id = privateName.id,
      getId = privateName.getId,
      setId = privateName.setId,
      initAdded = privateName.initAdded;
  if (initAdded) return;

  if (methodId) {
    return _core().template.statement.ast(_templateObject9(), ref, id, methodId.name);
  }

  if (getId || setId) {
    privateNamesMap.set(prop.node.key.id.name, Object.assign({}, privateName, {
      initAdded: true
    }));

    if (getId && setId) {
      return _core().template.statement.ast(_templateObject10(), ref, id, getId.name, setId.name);
    } else if (getId && !setId) {
      return _core().template.statement.ast(_templateObject11(), ref, id, getId.name);
    } else if (!getId && setId) {
      return _core().template.statement.ast(_templateObject12(), ref, id, setId.name);
    }
  }
}

function buildPrivateInstanceMethodInitSpec(ref, prop, privateNamesMap) {
  var privateName = privateNamesMap.get(prop.node.key.id.name);
  var id = privateName.id,
      getId = privateName.getId,
      setId = privateName.setId,
      initAdded = privateName.initAdded;
  if (initAdded) return;

  if (getId || setId) {
    privateNamesMap.set(prop.node.key.id.name, Object.assign({}, privateName, {
      initAdded: true
    }));

    if (getId && setId) {
      return _core().template.statement.ast(_templateObject13(), id, ref, getId.name, setId.name);
    } else if (getId && !setId) {
      return _core().template.statement.ast(_templateObject14(), id, ref, getId.name);
    } else if (!getId && setId) {
      return _core().template.statement.ast(_templateObject15(), id, ref, setId.name);
    }
  }

  return _core().template.statement.ast(_templateObject16(), id, ref);
}

function buildPublicFieldInitLoose(ref, prop) {
  var _prop$node = prop.node,
      key = _prop$node.key,
      computed = _prop$node.computed;
  var value = prop.node.value || prop.scope.buildUndefinedNode();
  return _core().types.expressionStatement(_core().types.assignmentExpression("=", _core().types.memberExpression(ref, key, computed || _core().types.isLiteral(key)), value));
}

function buildPublicFieldInitSpec(ref, prop, state) {
  var _prop$node2 = prop.node,
      key = _prop$node2.key,
      computed = _prop$node2.computed;
  var value = prop.node.value || prop.scope.buildUndefinedNode();
  return _core().types.expressionStatement(_core().types.callExpression(state.addHelper("defineProperty"), [ref, computed || _core().types.isLiteral(key) ? key : _core().types.stringLiteral(key.name), value]));
}

function buildPrivateInstanceMethodDeclaration(prop, privateNamesMap) {
  var privateName = privateNamesMap.get(prop.node.key.id.name);
  var methodId = privateName.methodId,
      getId = privateName.getId,
      setId = privateName.setId,
      getterDeclared = privateName.getterDeclared,
      setterDeclared = privateName.setterDeclared;
  var _prop$node3 = prop.node,
      params = _prop$node3.params,
      body = _prop$node3.body,
      generator = _prop$node3.generator,
      async = _prop$node3.async;

  var methodValue = _core().types.functionExpression(methodId, params, body, generator, async);

  var isGetter = getId && !getterDeclared && params.length === 0;
  var isSetter = setId && !setterDeclared && params.length > 0;

  if (isGetter) {
    privateNamesMap.set(prop.node.key.id.name, Object.assign({}, privateName, {
      getterDeclared: true
    }));
    return _core().types.variableDeclaration("var", [_core().types.variableDeclarator(getId, methodValue)]);
  }

  if (isSetter) {
    privateNamesMap.set(prop.node.key.id.name, Object.assign({}, privateName, {
      setterDeclared: true
    }));
    return _core().types.variableDeclaration("var", [_core().types.variableDeclarator(setId, methodValue)]);
  }

  return _core().types.variableDeclaration("var", [_core().types.variableDeclarator(methodId, methodValue)]);
}

function buildFieldsInitNodes(ref, props, privateNamesMap, state, loose) {
  var staticNodes = [];
  var instanceNodes = [];
  var needsClassRef = false;
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = props[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var prop = _step4.value;
      var isStatic = prop.node["static"];
      var isInstance = !isStatic;
      var isPrivate = prop.isPrivate();
      var isPublic = !isPrivate;
      var isField = prop.isProperty();
      var isMethod = !isField;

      switch (true) {
        case isStatic && isPrivate && isField && loose:
          needsClassRef = true;
          staticNodes.push(buildPrivateFieldInitLoose(_core().types.cloneNode(ref), prop, privateNamesMap));
          break;

        case isStatic && isPrivate && isField && !loose:
          needsClassRef = true;
          staticNodes.push(buildPrivateStaticFieldInitSpec(prop, privateNamesMap));
          break;

        case isStatic && isPublic && isField && loose:
          needsClassRef = true;
          staticNodes.push(buildPublicFieldInitLoose(_core().types.cloneNode(ref), prop));
          break;

        case isStatic && isPublic && isField && !loose:
          needsClassRef = true;
          staticNodes.push(buildPublicFieldInitSpec(_core().types.cloneNode(ref), prop, state));
          break;

        case isInstance && isPrivate && isField && loose:
          instanceNodes.push(buildPrivateFieldInitLoose(_core().types.thisExpression(), prop, privateNamesMap));
          break;

        case isInstance && isPrivate && isField && !loose:
          instanceNodes.push(buildPrivateInstanceFieldInitSpec(_core().types.thisExpression(), prop, privateNamesMap));
          break;

        case isInstance && isPrivate && isMethod && loose:
          instanceNodes.unshift(buildPrivateMethodInitLoose(_core().types.thisExpression(), prop, privateNamesMap));
          staticNodes.push(buildPrivateInstanceMethodDeclaration(prop, privateNamesMap));
          break;

        case isInstance && isPrivate && isMethod && !loose:
          instanceNodes.unshift(buildPrivateInstanceMethodInitSpec(_core().types.thisExpression(), prop, privateNamesMap));
          staticNodes.push(buildPrivateInstanceMethodDeclaration(prop, privateNamesMap));
          break;

        case isInstance && isPublic && isField && loose:
          instanceNodes.push(buildPublicFieldInitLoose(_core().types.thisExpression(), prop));
          break;

        case isInstance && isPublic && isField && !loose:
          instanceNodes.push(buildPublicFieldInitSpec(_core().types.thisExpression(), prop, state));
          break;

        default:
          throw new Error("Unreachable.");
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

  return {
    staticNodes: staticNodes,
    instanceNodes: instanceNodes.filter(Boolean),
    wrapClass: function wrapClass(path) {
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = props[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var prop = _step5.value;
          prop.remove();
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
            _iterator5["return"]();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      if (!needsClassRef) return path;

      if (path.isClassExpression()) {
        path.scope.push({
          id: ref
        });
        path.replaceWith(_core().types.assignmentExpression("=", _core().types.cloneNode(ref), path.node));
      } else if (!path.node.id) {
        path.node.id = ref;
      }

      return path;
    }
  };
}