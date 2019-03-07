'use strict';

require("./es6.regexp.to-string");

module.exports = function toString(it) {
  return RegExp.prototype.toString.call(it);
};