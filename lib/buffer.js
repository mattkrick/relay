"use strict";

var _interopRequireDefault2 = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault2(require("@babel/runtime/helpers/toConsumableArray"));

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _trimRight() {
  var data = _interopRequireDefault(require("./trim-right"));

  _trimRight = function _trimRight() {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

var SPACES_RE = /^[ \t]+$/;

var Buffer =
/*#__PURE__*/
function () {
  function Buffer(map) {
    this._map = null;
    this._buf = [];
    this._last = "";
    this._queue = [];
    this._position = {
      line: 1,
      column: 0
    };
    this._sourcePosition = {
      identifierName: null,
      line: null,
      column: null,
      filename: null
    };
    this._disallowedPop = null;
    this._map = map;
  }

  var _proto = Buffer.prototype;

  _proto.get = function get() {
    this._flush();

    var map = this._map;
    var result = {
      code: (0, _trimRight()["default"])(this._buf.join("")),
      map: null,
      rawMappings: map && map.getRawMappings()
    };

    if (map) {
      Object.defineProperty(result, "map", {
        configurable: true,
        enumerable: true,
        get: function get() {
          return this.map = map.get();
        },
        set: function set(value) {
          Object.defineProperty(this, "map", {
            value: value,
            writable: true
          });
        }
      });
    }

    return result;
  };

  _proto.append = function append(str) {
    this._flush();

    var _this$_sourcePosition = this._sourcePosition,
        line = _this$_sourcePosition.line,
        column = _this$_sourcePosition.column,
        filename = _this$_sourcePosition.filename,
        identifierName = _this$_sourcePosition.identifierName,
        force = _this$_sourcePosition.force;

    this._append(str, line, column, identifierName, filename, force);
  };

  _proto.queue = function queue(str) {
    if (str === "\n") {
      while (this._queue.length > 0 && SPACES_RE.test(this._queue[0][0])) {
        this._queue.shift();
      }
    }

    var _this$_sourcePosition2 = this._sourcePosition,
        line = _this$_sourcePosition2.line,
        column = _this$_sourcePosition2.column,
        filename = _this$_sourcePosition2.filename,
        identifierName = _this$_sourcePosition2.identifierName,
        force = _this$_sourcePosition2.force;

    this._queue.unshift([str, line, column, identifierName, filename, force]);
  };

  _proto._flush = function _flush() {
    var item;

    while (item = this._queue.pop()) {
      this._append.apply(this, (0, _toConsumableArray2["default"])(item));
    }
  };

  _proto._append = function _append(str, line, column, identifierName, filename, force) {
    if (this._map && str[0] !== "\n") {
      this._map.mark(this._position.line, this._position.column, line, column, identifierName, filename, force);
    }

    this._buf.push(str);

    this._last = str[str.length - 1];

    for (var i = 0; i < str.length; i++) {
      if (str[i] === "\n") {
        this._position.line++;
        this._position.column = 0;
      } else {
        this._position.column++;
      }
    }
  };

  _proto.removeTrailingNewline = function removeTrailingNewline() {
    if (this._queue.length > 0 && this._queue[0][0] === "\n") {
      this._queue.shift();
    }
  };

  _proto.removeLastSemicolon = function removeLastSemicolon() {
    if (this._queue.length > 0 && this._queue[0][0] === ";") {
      this._queue.shift();
    }
  };

  _proto.endsWith = function endsWith(suffix) {
    if (suffix.length === 1) {
      var last;

      if (this._queue.length > 0) {
        var str = this._queue[0][0];
        last = str[str.length - 1];
      } else {
        last = this._last;
      }

      return last === suffix;
    }

    var end = this._last + this._queue.reduce(function (acc, item) {
      return item[0] + acc;
    }, "");

    if (suffix.length <= end.length) {
      return end.slice(-suffix.length) === suffix;
    }

    return false;
  };

  _proto.hasContent = function hasContent() {
    return this._queue.length > 0 || !!this._last;
  };

  _proto.exactSource = function exactSource(loc, cb) {
    this.source("start", loc, true);
    cb();
    this.source("end", loc);

    this._disallowPop("start", loc);
  };

  _proto.source = function source(prop, loc, force) {
    if (prop && !loc) return;

    this._normalizePosition(prop, loc, this._sourcePosition, force);
  };

  _proto.withSource = function withSource(prop, loc, cb) {
    if (!this._map) return cb();
    var originalLine = this._sourcePosition.line;
    var originalColumn = this._sourcePosition.column;
    var originalFilename = this._sourcePosition.filename;
    var originalIdentifierName = this._sourcePosition.identifierName;
    this.source(prop, loc);
    cb();

    if ((!this._sourcePosition.force || this._sourcePosition.line !== originalLine || this._sourcePosition.column !== originalColumn || this._sourcePosition.filename !== originalFilename) && (!this._disallowedPop || this._disallowedPop.line !== originalLine || this._disallowedPop.column !== originalColumn || this._disallowedPop.filename !== originalFilename)) {
      this._sourcePosition.line = originalLine;
      this._sourcePosition.column = originalColumn;
      this._sourcePosition.filename = originalFilename;
      this._sourcePosition.identifierName = originalIdentifierName;
      this._sourcePosition.force = false;
      this._disallowedPop = null;
    }
  };

  _proto._disallowPop = function _disallowPop(prop, loc) {
    if (prop && !loc) return;
    this._disallowedPop = this._normalizePosition(prop, loc);
  };

  _proto._normalizePosition = function _normalizePosition(prop, loc, targetObj, force) {
    var pos = loc ? loc[prop] : null;

    if (targetObj === undefined) {
      targetObj = {
        identifierName: null,
        line: null,
        column: null,
        filename: null,
        force: false
      };
    }

    var origLine = targetObj.line;
    var origColumn = targetObj.column;
    var origFilename = targetObj.filename;
    targetObj.identifierName = prop === "start" && loc && loc.identifierName || null;
    targetObj.line = pos ? pos.line : null;
    targetObj.column = pos ? pos.column : null;
    targetObj.filename = loc && loc.filename || null;

    if (force || targetObj.line !== origLine || targetObj.column !== origColumn || targetObj.filename !== origFilename) {
      targetObj.force = force;
    }

    return targetObj;
  };

  _proto.getCurrentColumn = function getCurrentColumn() {
    var extra = this._queue.reduce(function (acc, item) {
      return item[0] + acc;
    }, "");

    var lastIndex = extra.lastIndexOf("\n");
    return lastIndex === -1 ? this._position.column + extra.length : extra.length - 1 - lastIndex;
  };

  _proto.getCurrentLine = function getCurrentLine() {
    var extra = this._queue.reduce(function (acc, item) {
      return item[0] + acc;
    }, "");

    var count = 0;

    for (var i = 0; i < extra.length; i++) {
      if (extra[i] === "\n") count++;
    }

    return this._position.line + count;
  };

  return Buffer;
}();

exports["default"] = Buffer;