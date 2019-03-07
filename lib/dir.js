"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

function _defaults() {
  var data = _interopRequireDefault(require("./defaults"));

  _defaults = function _defaults() {
    return data;
  };

  return data;
}

function _outputFileSync() {
  var data = _interopRequireDefault(require("./output-file-sync"));

  _outputFileSync = function _outputFileSync() {
    return data;
  };

  return data;
}

function _mkdirp() {
  var data = require("./mkdirp");

  _mkdirp = function _mkdirp() {
    return data;
  };

  return data;
}

function _slash() {
  var data = _interopRequireDefault(require("./slash"));

  _slash = function _slash() {
    return data;
  };

  return data;
}

function _path() {
  var data = _interopRequireDefault(require("path"));

  _path = function _path() {
    return data;
  };

  return data;
}

function _fs() {
  var data = _interopRequireDefault(require("fs"));

  _fs = function _fs() {
    return data;
  };

  return data;
}

var util = _interopRequireWildcard(require("./util"));

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

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _default(_x) {
  return _ref.apply(this, arguments);
}

function _ref() {
  _ref = _asyncToGenerator(function* (_ref2) {
    var cliOptions = _ref2.cliOptions,
        babelOptions = _ref2.babelOptions;
    var filenames = cliOptions.filenames;

    function write(_x2, _x3) {
      return _write.apply(this, arguments);
    }

    function _write() {
      _write = _asyncToGenerator(function* (src, base) {
        var relative = _path()["default"].relative(base, src);

        if (!util.isCompilableExtension(relative, cliOptions.extensions)) {
          return false;
        }

        relative = util.adjustRelative(relative, cliOptions.keepFileExtension);
        var dest = getDest(relative, base);

        try {
          var res = yield util.compile(src, (0, _defaults()["default"])({
            sourceFileName: (0, _slash()["default"])(_path()["default"].relative(dest + "/..", src))
          }, babelOptions));
          if (!res) return false;

          if (res.map && babelOptions.sourceMaps && babelOptions.sourceMaps !== "inline") {
            var mapLoc = dest + ".map";
            res.code = util.addSourceMappingUrl(res.code, mapLoc);
            res.map.file = _path()["default"].basename(relative);
            (0, _outputFileSync()["default"])(mapLoc, JSON.stringify(res.map));
          }

          (0, _outputFileSync()["default"])(dest, res.code);
          util.chmod(src, dest);

          if (cliOptions.verbose) {
            console.log(src + " -> " + dest);
          }

          return true;
        } catch (err) {
          if (cliOptions.watch) {
            console.error(err);
            return false;
          }

          throw err;
        }
      });
      return _write.apply(this, arguments);
    }

    function getDest(filename, base) {
      if (cliOptions.relative) {
        return _path()["default"].join(base, cliOptions.outDir, filename);
      }

      return _path()["default"].join(cliOptions.outDir, filename);
    }

    function handleFile(_x4, _x5) {
      return _handleFile.apply(this, arguments);
    }

    function _handleFile() {
      _handleFile = _asyncToGenerator(function* (src, base) {
        var written = yield write(src, base);

        if (!written && cliOptions.copyFiles) {
          var filename = _path()["default"].relative(base, src);

          var dest = getDest(filename, base);
          (0, _outputFileSync()["default"])(dest, _fs()["default"].readFileSync(src));
          util.chmod(src, dest);
        }

        return written;
      });
      return _handleFile.apply(this, arguments);
    }

    function handle(_x6) {
      return _handle.apply(this, arguments);
    }

    function _handle() {
      _handle = _asyncToGenerator(function* (filenameOrDir) {
        if (!_fs()["default"].existsSync(filenameOrDir)) return 0;

        var stat = _fs()["default"].statSync(filenameOrDir);

        if (stat.isDirectory()) {
          var dirname = filenameOrDir;
          var count = 0;
          var files = util.readdir(dirname, cliOptions.includeDotfiles);
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = files[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var filename = _step.value;

              var src = _path()["default"].join(dirname, filename);

              var written = yield handleFile(src, dirname);
              if (written) count += 1;
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

          return count;
        } else {
          var _filename = filenameOrDir;

          var _written = yield handleFile(_filename, _path()["default"].dirname(_filename));

          return _written ? 1 : 0;
        }
      });
      return _handle.apply(this, arguments);
    }

    if (!cliOptions.skipInitialBuild) {
      if (cliOptions.deleteDirOnStart) {
        util.deleteDir(cliOptions.outDir);
      }

      (0, _mkdirp().sync)(cliOptions.outDir);
      var compiledFiles = 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = cliOptions.filenames[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var filename = _step2.value;
          compiledFiles += yield handle(filename);
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

      console.log("Successfully compiled ".concat(compiledFiles, " ").concat(compiledFiles !== 1 ? "files" : "file", " with Babel."));
    }

    if (cliOptions.watch) {
      var chokidar = util.requireChokidar();
      filenames.forEach(function (filenameOrDir) {
        var watcher = chokidar.watch(filenameOrDir, {
          persistent: true,
          ignoreInitial: true,
          awaitWriteFinish: {
            stabilityThreshold: 50,
            pollInterval: 10
          }
        });
        ["add", "change"].forEach(function (type) {
          watcher.on(type, function (filename) {
            handleFile(filename, filename === filenameOrDir ? _path()["default"].dirname(filenameOrDir) : filenameOrDir)["catch"](function (err) {
              console.error(err);
            });
          });
        });
      });
    }
  });
  return _ref.apply(this, arguments);
}