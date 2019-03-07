"use strict";

require("./es6.object.define-properties");

var $Object = require("./_core").Object;

module.exports = function defineProperties(T, D) {
  return $Object.defineProperties(T, D);
};