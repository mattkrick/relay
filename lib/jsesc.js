'use strict';

var object = {};
var hasOwnProperty = object.hasOwnProperty;

var forOwn = function forOwn(object, callback) {
  for (var key in object) {
    if (hasOwnProperty.call(object, key)) {
      callback(key, object[key]);
    }
  }
};

var extend = function extend(destination, source) {
  if (!source) {
    return destination;
  }

  forOwn(source, function (key, value) {
    destination[key] = value;
  });
  return destination;
};

var forEach = function forEach(array, callback) {
  var length = array.length;
  var index = -1;

  while (++index < length) {
    callback(array[index]);
  }
};

var toString = object.toString;
var isArray = Array.isArray;
var isBuffer = Buffer.isBuffer;

var isObject = function isObject(value) {
  // This is a very simple check, but it’s good enough for what we need.
  return toString.call(value) == '[object Object]';
};

var isString = function isString(value) {
  return typeof value == 'string' || toString.call(value) == '[object String]';
};

var isNumber = function isNumber(value) {
  return typeof value == 'number' || toString.call(value) == '[object Number]';
};

var isFunction = function isFunction(value) {
  return typeof value == 'function';
};

var isMap = function isMap(value) {
  return toString.call(value) == '[object Map]';
};

var isSet = function isSet(value) {
  return toString.call(value) == '[object Set]';
};
/*--------------------------------------------------------------------------*/
// https://mathiasbynens.be/notes/javascript-escapes#single


var singleEscapes = {
  '"': '\\"',
  '\'': '\\\'',
  '\\': '\\\\',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t' // `\v` is omitted intentionally, because in IE < 9, '\v' == 'v'.
  // '\v': '\\x0B'

};
var regexSingleEscape = /["'\\\b\f\n\r\t]/;
var regexDigit = /[0-9]/;
var regexWhitelist = /[ !#-&\(-\[\]-_a-~]/;

var jsesc = function jsesc(argument, options) {
  var increaseIndentation = function increaseIndentation() {
    oldIndent = indent;
    ++options.indentLevel;
    indent = options.indent.repeat(options.indentLevel);
  }; // Handle options


  var defaults = {
    'escapeEverything': false,
    'minimal': false,
    'isScriptContext': false,
    'quotes': 'single',
    'wrap': false,
    'es6': false,
    'json': false,
    'compact': true,
    'lowercaseHex': false,
    'numbers': 'decimal',
    'indent': '\t',
    'indentLevel': 0,
    '__inline1__': false,
    '__inline2__': false
  };
  var json = options && options.json;

  if (json) {
    defaults.quotes = 'double';
    defaults.wrap = true;
  }

  options = extend(defaults, options);

  if (options.quotes != 'single' && options.quotes != 'double' && options.quotes != 'backtick') {
    options.quotes = 'single';
  }

  var quote = options.quotes == 'double' ? '"' : options.quotes == 'backtick' ? '`' : '\'';
  var compact = options.compact;
  var lowercaseHex = options.lowercaseHex;
  var indent = options.indent.repeat(options.indentLevel);
  var oldIndent = '';
  var inline1 = options.__inline1__;
  var inline2 = options.__inline2__;
  var newLine = compact ? '' : '\n';
  var result;
  var isEmpty = true;
  var useBinNumbers = options.numbers == 'binary';
  var useOctNumbers = options.numbers == 'octal';
  var useDecNumbers = options.numbers == 'decimal';
  var useHexNumbers = options.numbers == 'hexadecimal';

  if (json && argument && isFunction(argument.toJSON)) {
    argument = argument.toJSON();
  }

  if (!isString(argument)) {
    if (isMap(argument)) {
      if (argument.size == 0) {
        return 'new Map()';
      }

      if (!compact) {
        options.__inline1__ = true;
        options.__inline2__ = false;
      }

      return 'new Map(' + jsesc(Array.from(argument), options) + ')';
    }

    if (isSet(argument)) {
      if (argument.size == 0) {
        return 'new Set()';
      }

      return 'new Set(' + jsesc(Array.from(argument), options) + ')';
    }

    if (isBuffer(argument)) {
      if (argument.length == 0) {
        return 'Buffer.from([])';
      }

      return 'Buffer.from(' + jsesc(Array.from(argument), options) + ')';
    }

    if (isArray(argument)) {
      result = [];
      options.wrap = true;

      if (inline1) {
        options.__inline1__ = false;
        options.__inline2__ = true;
      }

      if (!inline2) {
        increaseIndentation();
      }

      forEach(argument, function (value) {
        isEmpty = false;

        if (inline2) {
          options.__inline2__ = false;
        }

        result.push((compact || inline2 ? '' : indent) + jsesc(value, options));
      });

      if (isEmpty) {
        return '[]';
      }

      if (inline2) {
        return '[' + result.join(', ') + ']';
      }

      return '[' + newLine + result.join(',' + newLine) + newLine + (compact ? '' : oldIndent) + ']';
    } else if (isNumber(argument)) {
      if (json) {
        // Some number values (e.g. `Infinity`) cannot be represented in JSON.
        return JSON.stringify(argument);
      }

      if (useDecNumbers) {
        return String(argument);
      }

      if (useHexNumbers) {
        var hexadecimal = argument.toString(16);

        if (!lowercaseHex) {
          hexadecimal = hexadecimal.toUpperCase();
        }

        return '0x' + hexadecimal;
      }

      if (useBinNumbers) {
        return '0b' + argument.toString(2);
      }

      if (useOctNumbers) {
        return '0o' + argument.toString(8);
      }
    } else if (!isObject(argument)) {
      if (json) {
        // For some values (e.g. `undefined`, `function` objects),
        // `JSON.stringify(value)` returns `undefined` (which isn’t valid
        // JSON) instead of `'null'`.
        return JSON.stringify(argument) || 'null';
      }

      return String(argument);
    } else {
      // it’s an object
      result = [];
      options.wrap = true;
      increaseIndentation();
      forOwn(argument, function (key, value) {
        isEmpty = false;
        result.push((compact ? '' : indent) + jsesc(key, options) + ':' + (compact ? '' : ' ') + jsesc(value, options));
      });

      if (isEmpty) {
        return '{}';
      }

      return '{' + newLine + result.join(',' + newLine) + newLine + (compact ? '' : oldIndent) + '}';
    }
  }

  var string = argument; // Loop over each code unit in the string and escape it

  var index = -1;
  var length = string.length;
  result = '';

  while (++index < length) {
    var character = string.charAt(index);

    if (options.es6) {
      var first = string.charCodeAt(index);

      if ( // check if it’s the start of a surrogate pair
      first >= 0xD800 && first <= 0xDBFF && // high surrogate
      length > index + 1 // there is a next code unit
      ) {
          var second = string.charCodeAt(index + 1);

          if (second >= 0xDC00 && second <= 0xDFFF) {
            // low surrogate
            // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            var codePoint = (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;

            var _hexadecimal2 = codePoint.toString(16);

            if (!lowercaseHex) {
              _hexadecimal2 = _hexadecimal2.toUpperCase();
            }

            result += "\\u{" + _hexadecimal2 + '}';
            ++index;
            continue;
          }
        }
    }

    if (!options.escapeEverything) {
      if (regexWhitelist.test(character)) {
        // It’s a printable ASCII character that is not `"`, `'` or `\`,
        // so don’t escape it.
        result += character;
        continue;
      }

      if (character == '"') {
        result += quote == character ? '\\"' : character;
        continue;
      }

      if (character == '`') {
        result += quote == character ? '\\`' : character;
        continue;
      }

      if (character == '\'') {
        result += quote == character ? '\\\'' : character;
        continue;
      }
    }

    if (character == '\0' && !json && !regexDigit.test(string.charAt(index + 1))) {
      result += '\\0';
      continue;
    }

    if (regexSingleEscape.test(character)) {
      // no need for a `hasOwnProperty` check here
      result += singleEscapes[character];
      continue;
    }

    var charCode = character.charCodeAt(0);

    if (options.minimal && charCode != 0x2028 && charCode != 0x2029) {
      result += character;
      continue;
    }

    var _hexadecimal = charCode.toString(16);

    if (!lowercaseHex) {
      _hexadecimal = _hexadecimal.toUpperCase();
    }

    var longhand = _hexadecimal.length > 2 || json;

    var escaped = '\\' + (longhand ? 'u' : 'x') + ('0000' + _hexadecimal).slice(longhand ? -4 : -2);

    result += escaped;
    continue;
  }

  if (options.wrap) {
    result = quote + result + quote;
  }

  if (quote == '`') {
    result = result.replace(/\$\{/g, '\\\$\{');
  }

  if (options.isScriptContext) {
    // https://mathiasbynens.be/notes/etago
    return result.replace(/<\/(script|style)/gi, '<\\/$1').replace(/<!--/g, json ? "\\u003C!--" : '\\x3C!--');
  }

  return result;
};

jsesc.version = '2.5.2';
module.exports = jsesc;