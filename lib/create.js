"use strict";

require("./es6.object.create");

var $Object = require("./_core").Object;

module.exports = function create(P, D) {
  return $Object.create(P, D);
};