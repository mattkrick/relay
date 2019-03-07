"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createCachedDescriptors = createCachedDescriptors;
exports.createUncachedDescriptors = createUncachedDescriptors;
exports.createDescriptor = createDescriptor;

var _files = require("./files");

var _item = require("./item");

var _caching = require("./caching");

function isEqualDescriptor(a, b) {
  return a.name === b.name && a.value === b.value && a.options === b.options && a.dirname === b.dirname && a.alias === b.alias && a.ownPass === b.ownPass && (a.file && a.file.request) === (b.file && b.file.request) && (a.file && a.file.resolved) === (b.file && b.file.resolved);
}

function createCachedDescriptors(dirname, options, alias) {
  var plugins = options.plugins,
      presets = options.presets,
      passPerPreset = options.passPerPreset;
  return {
    options: options,
    plugins: plugins ? function () {
      return createCachedPluginDescriptors(plugins, dirname)(alias);
    } : function () {
      return [];
    },
    presets: presets ? function () {
      return createCachedPresetDescriptors(presets, dirname)(alias)(!!passPerPreset);
    } : function () {
      return [];
    }
  };
}

function createUncachedDescriptors(dirname, options, alias) {
  var _plugins;

  var _presets;

  return {
    options: options,
    plugins: function plugins() {
      if (!_plugins) {
        _plugins = createPluginDescriptors(options.plugins || [], dirname, alias);
      }

      return _plugins;
    },
    presets: function presets() {
      if (!_presets) {
        _presets = createPresetDescriptors(options.presets || [], dirname, alias, !!options.passPerPreset);
      }

      return _presets;
    }
  };
}

var PRESET_DESCRIPTOR_CACHE = new WeakMap();
var createCachedPresetDescriptors = (0, _caching.makeWeakCache)(function (items, cache) {
  var dirname = cache.using(function (dir) {
    return dir;
  });
  return (0, _caching.makeStrongCache)(function (alias) {
    return (0, _caching.makeStrongCache)(function (passPerPreset) {
      return createPresetDescriptors(items, dirname, alias, passPerPreset).map(function (desc) {
        return loadCachedDescriptor(PRESET_DESCRIPTOR_CACHE, desc);
      });
    });
  });
});
var PLUGIN_DESCRIPTOR_CACHE = new WeakMap();
var createCachedPluginDescriptors = (0, _caching.makeWeakCache)(function (items, cache) {
  var dirname = cache.using(function (dir) {
    return dir;
  });
  return (0, _caching.makeStrongCache)(function (alias) {
    return createPluginDescriptors(items, dirname, alias).map(function (desc) {
      return loadCachedDescriptor(PLUGIN_DESCRIPTOR_CACHE, desc);
    });
  });
});
var DEFAULT_OPTIONS = {};

function loadCachedDescriptor(cache, desc) {
  var value = desc.value,
      _desc$options = desc.options,
      options = _desc$options === void 0 ? DEFAULT_OPTIONS : _desc$options;
  if (options === false) return desc;
  var cacheByOptions = cache.get(value);

  if (!cacheByOptions) {
    cacheByOptions = new WeakMap();
    cache.set(value, cacheByOptions);
  }

  var possibilities = cacheByOptions.get(options);

  if (!possibilities) {
    possibilities = [];
    cacheByOptions.set(options, possibilities);
  }

  if (possibilities.indexOf(desc) === -1) {
    var matches = possibilities.filter(function (possibility) {
      return isEqualDescriptor(possibility, desc);
    });

    if (matches.length > 0) {
      return matches[0];
    }

    possibilities.push(desc);
  }

  return desc;
}

function createPresetDescriptors(items, dirname, alias, passPerPreset) {
  return createDescriptors("preset", items, dirname, alias, passPerPreset);
}

function createPluginDescriptors(items, dirname, alias) {
  return createDescriptors("plugin", items, dirname, alias);
}

function createDescriptors(type, items, dirname, alias, ownPass) {
  var descriptors = items.map(function (item, index) {
    return createDescriptor(item, dirname, {
      type: type,
      alias: "".concat(alias, "$").concat(index),
      ownPass: !!ownPass
    });
  });
  assertNoDuplicates(descriptors);
  return descriptors;
}

function createDescriptor(pair, dirname, _ref) {
  var type = _ref.type,
      alias = _ref.alias,
      ownPass = _ref.ownPass;
  var desc = (0, _item.getItemDescriptor)(pair);

  if (desc) {
    return desc;
  }

  var name;
  var options;
  var value = pair;

  if (Array.isArray(value)) {
    if (value.length === 3) {
      var _value = value;
      value = _value[0];
      options = _value[1];
      name = _value[2];
    } else {
      var _value2 = value;
      value = _value2[0];
      options = _value2[1];
    }
  }

  var file = undefined;
  var filepath = null;

  if (typeof value === "string") {
    if (typeof type !== "string") {
      throw new Error("To resolve a string-based item, the type of item must be given");
    }

    var resolver = type === "plugin" ? _files.loadPlugin : _files.loadPreset;
    var request = value;

    var _resolver = resolver(value, dirname);

    filepath = _resolver.filepath;
    value = _resolver.value;
    file = {
      request: request,
      resolved: filepath
    };
  }

  if (!value) {
    throw new Error("Unexpected falsy value: ".concat(String(value)));
  }

  if (typeof value === "object" && value.__esModule) {
    if (value["default"]) {
      value = value["default"];
    } else {
      throw new Error("Must export a default export when using ES6 modules.");
    }
  }

  if (typeof value !== "object" && typeof value !== "function") {
    throw new Error("Unsupported format: ".concat(typeof value, ". Expected an object or a function."));
  }

  if (filepath !== null && typeof value === "object" && value) {
    throw new Error("Plugin/Preset files are not allowed to export objects, only functions. In ".concat(filepath));
  }

  return {
    name: name,
    alias: filepath || alias,
    value: value,
    options: options,
    dirname: dirname,
    ownPass: ownPass,
    file: file
  };
}

function assertNoDuplicates(items) {
  var map = new Map();
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = items[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var item = _step.value;
      if (typeof item.value !== "function") continue;
      var nameMap = map.get(item.value);

      if (!nameMap) {
        nameMap = new Set();
        map.set(item.value, nameMap);
      }

      if (nameMap.has(item.name)) {
        throw new Error(["Duplicate plugin/preset detected.", "If you'd like to use two separate instances of a plugin,", "they need separate names, e.g.", "", "  plugins: [", "    ['some-plugin', {}],", "    ['some-plugin', {}, 'some unique name'],", "  ]"].join("\n"));
      }

      nameMap.add(item.name);
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