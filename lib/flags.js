"use strict";

require("./es6.regexp.flags");

var flags = require("./_flags");

module.exports = function (it) {
  return flags.call(it);
};