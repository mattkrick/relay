'use strict';

require("./es6.weak-set");

require("./es7.weak-set.from");

var $WeakSet = require("./_core").WeakSet;

var $from = $WeakSet.from;

module.exports = function from(source, mapFn, thisArg) {
  return $from.call(typeof this === 'function' ? this : $WeakSet, source, mapFn, thisArg);
};