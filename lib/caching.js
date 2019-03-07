"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeStrongCache = makeStrongCache;
exports.makeWeakCache = makeWeakCache;
exports.assertSimpleType = assertSimpleType;

function makeStrongCache(handler) {
  return makeCachedFunction(new Map(), handler);
}

function makeWeakCache(handler) {
  return makeCachedFunction(new WeakMap(), handler);
}

function makeCachedFunction(callCache, handler) {
  return function cachedFunction(arg, data) {
    var cachedValue = callCache.get(arg);

    if (cachedValue) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = cachedValue[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _ref = _step.value;
          var _value = _ref.value,
              valid = _ref.valid;
          if (valid(data)) return _value;
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

    var cache = new CacheConfigurator(data);
    var value = handler(arg, cache);
    if (!cache.configured()) cache.forever();
    cache.deactivate();

    switch (cache.mode()) {
      case "forever":
        cachedValue = [{
          value: value,
          valid: function valid() {
            return true;
          }
        }];
        callCache.set(arg, cachedValue);
        break;

      case "invalidate":
        cachedValue = [{
          value: value,
          valid: cache.validator()
        }];
        callCache.set(arg, cachedValue);
        break;

      case "valid":
        if (cachedValue) {
          cachedValue.push({
            value: value,
            valid: cache.validator()
          });
        } else {
          cachedValue = [{
            value: value,
            valid: cache.validator()
          }];
          callCache.set(arg, cachedValue);
        }

    }

    return value;
  };
}

var CacheConfigurator =
/*#__PURE__*/
function () {
  function CacheConfigurator(data) {
    this._active = true;
    this._never = false;
    this._forever = false;
    this._invalidate = false;
    this._configured = false;
    this._pairs = [];
    this._data = data;
  }

  var _proto = CacheConfigurator.prototype;

  _proto.simple = function simple() {
    return makeSimpleConfigurator(this);
  };

  _proto.mode = function mode() {
    if (this._never) return "never";
    if (this._forever) return "forever";
    if (this._invalidate) return "invalidate";
    return "valid";
  };

  _proto.forever = function forever() {
    if (!this._active) {
      throw new Error("Cannot change caching after evaluation has completed.");
    }

    if (this._never) {
      throw new Error("Caching has already been configured with .never()");
    }

    this._forever = true;
    this._configured = true;
  };

  _proto.never = function never() {
    if (!this._active) {
      throw new Error("Cannot change caching after evaluation has completed.");
    }

    if (this._forever) {
      throw new Error("Caching has already been configured with .forever()");
    }

    this._never = true;
    this._configured = true;
  };

  _proto.using = function using(handler) {
    if (!this._active) {
      throw new Error("Cannot change caching after evaluation has completed.");
    }

    if (this._never || this._forever) {
      throw new Error("Caching has already been configured with .never or .forever()");
    }

    this._configured = true;
    var key = handler(this._data);

    this._pairs.push([key, handler]);

    return key;
  };

  _proto.invalidate = function invalidate(handler) {
    if (!this._active) {
      throw new Error("Cannot change caching after evaluation has completed.");
    }

    if (this._never || this._forever) {
      throw new Error("Caching has already been configured with .never or .forever()");
    }

    this._invalidate = true;
    this._configured = true;
    var key = handler(this._data);

    this._pairs.push([key, handler]);

    return key;
  };

  _proto.validator = function validator() {
    var pairs = this._pairs;
    return function (data) {
      return pairs.every(function (_ref2) {
        var key = _ref2[0],
            fn = _ref2[1];
        return key === fn(data);
      });
    };
  };

  _proto.deactivate = function deactivate() {
    this._active = false;
  };

  _proto.configured = function configured() {
    return this._configured;
  };

  return CacheConfigurator;
}();

function makeSimpleConfigurator(cache) {
  function cacheFn(val) {
    if (typeof val === "boolean") {
      if (val) cache.forever();else cache.never();
      return;
    }

    return cache.using(function () {
      return assertSimpleType(val());
    });
  }

  cacheFn.forever = function () {
    return cache.forever();
  };

  cacheFn.never = function () {
    return cache.never();
  };

  cacheFn.using = function (cb) {
    return cache.using(function () {
      return assertSimpleType(cb());
    });
  };

  cacheFn.invalidate = function (cb) {
    return cache.invalidate(function () {
      return assertSimpleType(cb());
    });
  };

  return cacheFn;
}

function assertSimpleType(value) {
  if (value != null && typeof value !== "string" && typeof value !== "boolean" && typeof value !== "number") {
    throw new Error("Cache keys must be either string, boolean, number, null, or undefined.");
  }

  return value;
}