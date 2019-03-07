'use strict';

require("./es6.weak-set");

require("./es7.weak-set.of");

var $WeakSet = require("./_core").WeakSet;

var $of = $WeakSet.of;

module.exports = function of() {
  return $of.apply(typeof this === 'function' ? this : $WeakSet, arguments);
};