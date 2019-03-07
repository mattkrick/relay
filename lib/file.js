"use strict";

var _interopRequireDefault2 = require("@babel/runtime/helpers/interopRequireDefault");

var _createClass2 = _interopRequireDefault2(require("./createClass"));

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function helpers() {
  var data = _interopRequireWildcard(require("./helpers"));

  helpers = function helpers() {
    return data;
  };

  return data;
}

function _traverse() {
  var data = _interopRequireWildcard(require("@babel/traverse"));

  _traverse = function _traverse() {
    return data;
  };

  return data;
}

function _codeFrame() {
  var data = require("./code-frame");

  _codeFrame = function _codeFrame() {
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

function _semver() {
  var data = _interopRequireDefault(require("./semver"));

  _semver = function _semver() {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
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

var errorVisitor = {
  enter: function enter(path, state) {
    var loc = path.node.loc;

    if (loc) {
      state.loc = loc;
      path.stop();
    }
  }
};

var File =
/*#__PURE__*/
function () {
  function File(options, _ref) {
    var _this = this;

    var code = _ref.code,
        ast = _ref.ast,
        inputMap = _ref.inputMap;
    this._map = new Map();
    this.declarations = {};
    this.path = null;
    this.ast = {};
    this.metadata = {};
    this.code = "";
    this.inputMap = null;
    this.hub = {
      file: this,
      getCode: function getCode() {
        return _this.code;
      },
      getScope: function getScope() {
        return _this.scope;
      },
      addHelper: this.addHelper.bind(this),
      buildError: this.buildCodeFrameError.bind(this)
    };
    this.opts = options;
    this.code = code;
    this.ast = ast;
    this.inputMap = inputMap;
    this.path = _traverse().NodePath.get({
      hub: this.hub,
      parentPath: null,
      parent: this.ast,
      container: this.ast,
      key: "program"
    }).setContext();
    this.scope = this.path.scope;
  }

  var _proto = File.prototype;

  _proto.set = function set(key, val) {
    if (key === "helpersNamespace") {
      throw new Error("Babel 7.0.0-beta.56 has dropped support for the 'helpersNamespace' utility." + "If you are using @babel/plugin-external-helpers you will need to use a newer " + "version than the one you currently have installed. " + "If you have your own implementation, you'll want to explore using 'helperGenerator' " + "alongside 'file.availableHelper()'.");
    }

    this._map.set(key, val);
  };

  _proto.get = function get(key) {
    return this._map.get(key);
  };

  _proto.has = function has(key) {
    return this._map.has(key);
  };

  _proto.getModuleName = function getModuleName() {
    var _this$opts = this.opts,
        filename = _this$opts.filename,
        _this$opts$filenameRe = _this$opts.filenameRelative,
        filenameRelative = _this$opts$filenameRe === void 0 ? filename : _this$opts$filenameRe,
        moduleId = _this$opts.moduleId,
        _this$opts$moduleIds = _this$opts.moduleIds,
        moduleIds = _this$opts$moduleIds === void 0 ? !!moduleId : _this$opts$moduleIds,
        getModuleId = _this$opts.getModuleId,
        sourceRootTmp = _this$opts.sourceRoot,
        _this$opts$moduleRoot = _this$opts.moduleRoot,
        moduleRoot = _this$opts$moduleRoot === void 0 ? sourceRootTmp : _this$opts$moduleRoot,
        _this$opts$sourceRoot = _this$opts.sourceRoot,
        sourceRoot = _this$opts$sourceRoot === void 0 ? moduleRoot : _this$opts$sourceRoot;
    if (!moduleIds) return null;

    if (moduleId != null && !getModuleId) {
      return moduleId;
    }

    var moduleName = moduleRoot != null ? moduleRoot + "/" : "";

    if (filenameRelative) {
      var sourceRootReplacer = sourceRoot != null ? new RegExp("^" + sourceRoot + "/?") : "";
      moduleName += filenameRelative.replace(sourceRootReplacer, "").replace(/\.(\w*?)$/, "");
    }

    moduleName = moduleName.replace(/\\/g, "/");

    if (getModuleId) {
      return getModuleId(moduleName) || moduleName;
    } else {
      return moduleName;
    }
  };

  _proto.addImport = function addImport() {
    throw new Error("This API has been removed. If you're looking for this " + "functionality in Babel 7, you should import the " + "'@babel/helper-module-imports' module and use the functions exposed " + " from that module, such as 'addNamed' or 'addDefault'.");
  };

  _proto.availableHelper = function availableHelper(name, versionRange) {
    var minVersion;

    try {
      minVersion = helpers().minVersion(name);
    } catch (err) {
      if (err.code !== "BABEL_HELPER_UNKNOWN") throw err;
      return false;
    }

    if (typeof versionRange !== "string") return true;
    if (_semver()["default"].valid(versionRange)) versionRange = "^".concat(versionRange);
    return !_semver()["default"].intersects("<".concat(minVersion), versionRange) && !_semver()["default"].intersects(">=8.0.0", versionRange);
  };

  _proto.addHelper = function addHelper(name) {
    var _this2 = this;

    var declar = this.declarations[name];
    if (declar) return t().cloneNode(declar);
    var generator = this.get("helperGenerator");

    if (generator) {
      var res = generator(name);
      if (res) return res;
    }

    var uid = this.declarations[name] = this.scope.generateUidIdentifier(name);
    var dependencies = {};
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = helpers().getDependencies(name)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var dep = _step.value;
        dependencies[dep] = this.addHelper(dep);
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

    var _helpers$get = helpers().get(name, function (dep) {
      return dependencies[dep];
    }, uid, Object.keys(this.scope.getAllBindings())),
        nodes = _helpers$get.nodes,
        globals = _helpers$get.globals;

    globals.forEach(function (name) {
      if (_this2.path.scope.hasBinding(name, true)) {
        _this2.path.scope.rename(name);
      }
    });
    nodes.forEach(function (node) {
      node._compact = true;
    });
    this.path.unshiftContainer("body", nodes);
    this.path.get("body").forEach(function (path) {
      if (nodes.indexOf(path.node) === -1) return;
      if (path.isVariableDeclaration()) _this2.scope.registerDeclaration(path);
    });
    return uid;
  };

  _proto.addTemplateObject = function addTemplateObject() {
    throw new Error("This function has been moved into the template literal transform itself.");
  };

  _proto.buildCodeFrameError = function buildCodeFrameError(node, msg) {
    var Error = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : SyntaxError;
    var loc = node && (node.loc || node._loc);
    msg = "".concat(this.opts.filename, ": ").concat(msg);

    if (!loc && node) {
      var state = {
        loc: null
      };
      (0, _traverse()["default"])(node, errorVisitor, this.scope, state);
      loc = state.loc;
      var txt = "This is an error on an internal node. Probably an internal error.";
      if (loc) txt += " Location has been estimated.";
      msg += " (".concat(txt, ")");
    }

    if (loc) {
      var _this$opts$highlightC = this.opts.highlightCode,
          highlightCode = _this$opts$highlightC === void 0 ? true : _this$opts$highlightC;
      msg += "\n" + (0, _codeFrame().codeFrameColumns)(this.code, {
        start: {
          line: loc.start.line,
          column: loc.start.column + 1
        }
      }, {
        highlightCode: highlightCode
      });
    }

    return new Error(msg);
  };

  (0, _createClass2["default"])(File, [{
    key: "shebang",
    get: function get() {
      var interpreter = this.path.node.interpreter;
      return interpreter ? interpreter.value : "";
    },
    set: function set(value) {
      if (value) {
        this.path.get("interpreter").replaceWith(t().interpreterDirective(value));
      } else {
        this.path.get("interpreter").remove();
      }
    }
  }]);
  return File;
}();

exports["default"] = File;