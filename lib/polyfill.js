"use strict";

// not "use strict" so we can declare global "Promise"
var asap = require("./asap");

if (typeof Promise === 'undefined') {
  Promise = require("./core.js");

  require("./es6-extensions.js");
}

require("./polyfill-done.js");