"use strict";

require("./es6.object.get-own-property-names");

var $Object = require("./_core").Object;

module.exports = function getOwnPropertyNames(it) {
  return $Object.getOwnPropertyNames(it);
};