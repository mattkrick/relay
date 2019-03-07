"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findParent = findParent;
exports.find = find;
exports.getFunctionParent = getFunctionParent;
exports.getStatementParent = getStatementParent;
exports.getEarliestCommonAncestorFrom = getEarliestCommonAncestorFrom;
exports.getDeepestCommonAncestorFrom = getDeepestCommonAncestorFrom;
exports.getAncestry = getAncestry;
exports.isAncestor = isAncestor;
exports.isDescendant = isDescendant;
exports.inType = inType;

function t() {
  var data = _interopRequireWildcard(require("@babel/types"));

  t = function t() {
    return data;
  };

  return data;
}

var _index = _interopRequireDefault(require("./index"));

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

function findParent(callback) {
  var path = this;

  while (path = path.parentPath) {
    if (callback(path)) return path;
  }

  return null;
}

function find(callback) {
  var path = this;

  do {
    if (callback(path)) return path;
  } while (path = path.parentPath);

  return null;
}

function getFunctionParent() {
  return this.findParent(function (p) {
    return p.isFunction();
  });
}

function getStatementParent() {
  var path = this;

  do {
    if (!path.parentPath || Array.isArray(path.container) && path.isStatement()) {
      break;
    } else {
      path = path.parentPath;
    }
  } while (path);

  if (path && (path.isProgram() || path.isFile())) {
    throw new Error("File/Program node, we can't possibly find a statement parent to this");
  }

  return path;
}

function getEarliestCommonAncestorFrom(paths) {
  return this.getDeepestCommonAncestorFrom(paths, function (deepest, i, ancestries) {
    var earliest;
    var keys = t().VISITOR_KEYS[deepest.type];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = ancestries[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var ancestry = _step.value;
        var path = ancestry[i + 1];

        if (!earliest) {
          earliest = path;
          continue;
        }

        if (path.listKey && earliest.listKey === path.listKey) {
          if (path.key < earliest.key) {
            earliest = path;
            continue;
          }
        }

        var earliestKeyIndex = keys.indexOf(earliest.parentKey);
        var currentKeyIndex = keys.indexOf(path.parentKey);

        if (earliestKeyIndex > currentKeyIndex) {
          earliest = path;
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

    return earliest;
  });
}

function getDeepestCommonAncestorFrom(paths, filter) {
  var _this = this;

  if (!paths.length) {
    return this;
  }

  if (paths.length === 1) {
    return paths[0];
  }

  var minDepth = Infinity;
  var lastCommonIndex, lastCommon;
  var ancestries = paths.map(function (path) {
    var ancestry = [];

    do {
      ancestry.unshift(path);
    } while ((path = path.parentPath) && path !== _this);

    if (ancestry.length < minDepth) {
      minDepth = ancestry.length;
    }

    return ancestry;
  });
  var first = ancestries[0];

  depthLoop: for (var i = 0; i < minDepth; i++) {
    var shouldMatch = first[i];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = ancestries[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var ancestry = _step2.value;

        if (ancestry[i] !== shouldMatch) {
          break depthLoop;
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

    lastCommonIndex = i;
    lastCommon = shouldMatch;
  }

  if (lastCommon) {
    if (filter) {
      return filter(lastCommon, lastCommonIndex, ancestries);
    } else {
      return lastCommon;
    }
  } else {
    throw new Error("Couldn't find intersection");
  }
}

function getAncestry() {
  var path = this;
  var paths = [];

  do {
    paths.push(path);
  } while (path = path.parentPath);

  return paths;
}

function isAncestor(maybeDescendant) {
  return maybeDescendant.isDescendant(this);
}

function isDescendant(maybeAncestor) {
  return !!this.findParent(function (parent) {
    return parent === maybeAncestor;
  });
}

function inType() {
  var path = this;

  while (path) {
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = arguments[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var type = _step3.value;
        if (path.node.type === type) return true;
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

    path = path.parentPath;
  }

  return false;
}